import { supabase } from "./admin-supabase";

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

async function call(action: string, body: unknown): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(`/api/admin/${action}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, j.error ?? "Error");
  }
  return res;
}

export const api = async <T = unknown>(action: string, body?: unknown): Promise<T> => (await call(action, body)).json() as Promise<T>;

export async function apiDownload(action: string, body: unknown): Promise<void> {
  const res = await call(action, body);
  const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "export.zip";
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function genPassword(len = 16): string {
  const sets = ["abcdefghijkmnopqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!@#$%^&*-_=+"];
  const all = sets.join("");
  const rnd = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0]! % n;
  const out = sets.map((s) => s[rnd(s.length)]!);
  while (out.length < len) out.push(all[rnd(all.length)]!);
  for (let i = out.length - 1; i > 0; i--) { const j = rnd(i + 1); [out[i], out[j]] = [out[j]!, out[i]!]; }
  return out.join("");
}
