// Admin guard: JWT verify -> platform_admins (service role) -> MFA (aal2) -> rate limit.
// Non-admin / bad token => 403. Service-role key sirf yahin (server env) se aati hai.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

let _db: SupabaseClient | undefined;
export function db(): SupabaseClient {
  if (_db) return _db;
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new HttpError(500, "Server not configured");
  _db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined);
        if (init?.headers) new Headers(init.headers).forEach((v, k) => h.set(k, v));
        // New-style opaque keys bearer JWT nahi hoti.
        if (key.startsWith("sb_secret_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  return _db;
}

// --- basic in-memory rate limit (per server instance; edge par Cloudflare rate-limit rule bhi lagayein) ---
const buckets = new Map<string, { n: number; reset: number }>();
function hit(key: string, max: number, windowMs = 60_000): boolean {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.reset <= now) {
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
    b = { n: 0, reset: now + windowMs };
    buckets.set(key, b);
  }
  return ++b.n <= max;
}

export type Kind = "read" | "write" | "heavy";
const LIMITS: Record<Kind, number> = { read: 120, write: 30, heavy: 6 }; // per admin per minute

export type AdminCtx = { adminId: string; db: SupabaseClient; ip: string };

export async function requireAdmin(request: Request, kind: Kind): Promise<AdminCtx> {
  const ip =
    request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!hit(`ip:${ip}`, 300)) throw new HttpError(429, "Too many requests");

  // Har failure generic 403 (koi detail leak nahi); bar-bar fail par 429.
  const deny = (): never => {
    throw hit(`fail:${ip}`, 20) ? new HttpError(403, "forbidden") : new HttpError(429, "Too many requests");
  };

  const token = /^Bearer ([\w-]+\.[\w-]+\.[\w-]+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) return deny();

  const d = db();
  // Malformed/forged token par supabase-js throw karta hai — fail-closed: hamesha 403, kabhi 500 nahi.
  let sub: string | undefined;
  let aal: string | undefined;
  try {
    const { data: c, error: ce } = await d.auth.getClaims(token); // signature + expiry
    if (ce || !c?.claims?.sub) return deny();
    const { data: u, error: ue } = await d.auth.getUser(token); // session abhi bhi valid (revocation)
    if (ue || u?.user?.id !== c.claims.sub) return deny();
    sub = c.claims.sub;
    aal = (c.claims as { aal?: string }).aal;
  } catch {
    return deny();
  }

  if (!sub) return deny();
  const { data: row, error: re } = await d.from("platform_admins").select("user_id").eq("user_id", sub).maybeSingle();
  if (re) throw new HttpError(500, "Server error");
  if (!row) return deny();

  // Admin confirm ho chuka — ab MFA (TOTP) enforce: session aal2 honi chahiye.
  if (process.env["ADMIN_REQUIRE_MFA"] !== "false" && aal !== "aal2") throw new HttpError(403, "mfa_required");

  if (!hit(`admin:${sub}:${kind}`, LIMITS[kind])) throw new HttpError(429, "Too many requests");
  return { adminId: sub, db: d, ip };
}
