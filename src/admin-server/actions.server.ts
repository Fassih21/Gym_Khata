import { z } from "zod";
import { HttpError, requireAdmin, type AdminCtx, type Kind } from "./guard.server";
import { buildGymExport } from "./export.server";

const uuid = z.string().uuid();
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => new Date(`${s}T00:00:00Z`).toISOString().startsWith(s), "Invalid date");
const password = z
  .string()
  .min(12)
  .max(72)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/\d/)
  .regex(/[^A-Za-z0-9]/, "Password: 12+ chars, upper, lower, digit, symbol");
const today = () => new Date().toISOString().slice(0, 10);

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", "x-content-type-options": "nosniff", ...extra },
  });

async function audit(c: AdminCtx, action: string, gymId: string | null, details: Record<string, unknown> = {}) {
  const { error } = await c.db.rpc("admin_audit", { p_admin: c.adminId, p_action: action, p_gym: gymId, p_details: details });
  if (error) throw new HttpError(500, "Audit log failed"); // fail-closed
}
const rpcFail = (e: { code?: string; message: string }): never => {
  if (e.code === "P0002") throw new HttpError(404, "Gym not found");
  if (e.code === "P0001") throw new HttpError(409, e.message);
  console.error("[admin rpc]", e.code, e.message);
  throw new HttpError(500, "Server error");
};
async function getGym(c: AdminCtx, id: string) {
  const { data, error } = await c.db.from("gyms").select("id,name,status,subscription_ends_on").eq("id", id).maybeSingle();
  if (error) throw new HttpError(500, "Server error");
  if (!data) throw new HttpError(404, "Gym not found");
  return data as { id: string; name: string; status: string; subscription_ends_on: string };
}

// storage `photos/{gym_id}/...` recursive list + remove
async function purgeStorage(c: AdminCtx, gymId: string) {
  const bucket = c.db.storage.from("photos");
  const paths: string[] = [];
  const stack = [gymId];
  while (stack.length) {
    const prefix = stack.pop()!;
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await bucket.list(prefix, { limit: 100, offset });
      if (error) throw new HttpError(500, "Storage list failed");
      for (const o of data ?? []) (o.id === null ? stack : paths).push(`${prefix}/${o.name}`);
      if ((data?.length ?? 0) < 100) break;
    }
  }
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await bucket.remove(paths.slice(i, i + 100));
    if (error) throw new HttpError(500, "Storage delete failed");
  }
  return paths.length;
}

type Def = { kind: Kind; run: (c: AdminCtx, body: unknown) => Promise<unknown> };
const A: Record<string, Def> = {
  me: { kind: "read", run: async (c) => ({ admin_id: c.adminId }) },

  "list-gyms": {
    kind: "read",
    run: async (c) => {
      const { data, error } = await c.db.rpc("admin_list_gyms");
      if (error) return rpcFail(error);
      return { gyms: data };
    },
  },

  "create-gym": {
    kind: "write",
    run: async (c, body) => {
      const i = z
        .object({
          name: z.string().trim().min(1).max(120),
          owner_email: z.string().trim().toLowerCase().email().max(254),
          password,
          plan: z.string().trim().min(1).max(40),
          subscription_ends_on: isoDate.refine((s) => s >= today(), "Date past mein nahi ho sakti"),
        })
        .parse(body);
      const { data: created, error: ue } = await c.db.auth.admin.createUser({
        email: i.owner_email,
        password: i.password,
        email_confirm: true,
      });
      if (ue || !created.user) throw new HttpError(409, "Owner user nahi ban saka (email pehle se registered ho sakti hai)");
      const uid = created.user.id;
      const { data: gymId, error } = await c.db.rpc("admin_create_gym", {
        p_admin: c.adminId, p_name: i.name, p_user: uid, p_email: i.owner_email, p_plan: i.plan, p_ends_on: i.subscription_ends_on,
      });
      if (error) {
        // Rollback: sirf wahi auth user hatao jo abhi banaya (gyms+gym_users RPC mein already rollback).
        const { error: de } = await c.db.auth.admin.deleteUser(uid);
        await audit(c, de ? "create_gym_rollback_failed" : "create_gym_failed", null, { owner_user_id: uid, code: error.code ?? null });
        return rpcFail(error);
      }
      return { gym_id: gymId };
    },
  },

  "set-status": {
    kind: "write",
    run: async (c, body) => {
      const i = z.object({ gym_id: uuid, status: z.enum(["active", "suspended"]) }).parse(body);
      const { error } = await c.db.rpc("admin_set_gym_status", { p_admin: c.adminId, p_gym: i.gym_id, p_status: i.status });
      if (error) return rpcFail(error);
      return { ok: true };
    },
  },

  extend: {
    kind: "write",
    run: async (c, body) => {
      const i = z
        .object({
          gym_id: uuid,
          new_ends_on: isoDate.refine((s) => s >= today(), "Date past mein nahi ho sakti"),
          amount: z.number().min(0).max(1e9),
          method: z.string().trim().min(1).max(40),
          note: z.string().trim().max(500).optional(),
        })
        .parse(body);
      const { error } = await c.db.rpc("admin_extend_subscription", {
        p_admin: c.adminId, p_gym: i.gym_id, p_new_ends_on: i.new_ends_on, p_amount: i.amount, p_method: i.method, p_note: i.note ?? null,
      });
      if (error) return rpcFail(error);
      return { ok: true };
    },
  },

  "reset-password": {
    kind: "heavy",
    run: async (c, body) => {
      const i = z.object({ gym_id: uuid, password }).parse(body);
      const { data: owner, error } = await c.db
        .from("gym_users").select("user_id").eq("gym_id", i.gym_id).eq("role", "owner").order("created_at").limit(1).maybeSingle();
      if (error) throw new HttpError(500, "Server error");
      if (!owner) throw new HttpError(404, "Owner not found");
      await audit(c, "reset_owner_password", i.gym_id, { owner_user_id: owner.user_id }); // password kabhi log nahi
      const { error: pe } = await c.db.auth.admin.updateUserById(owner.user_id as string, { password: i.password });
      if (pe) throw new HttpError(500, "Password reset failed");
      return { ok: true };
    },
  },

  "export-gym": {
    kind: "heavy",
    run: async (c, body) => {
      const i = z.object({ gym_id: uuid }).parse(body);
      const gym = await getGym(c, i.gym_id);
      await audit(c, "export_gym", gym.id, { pii_included: process.env["ADMIN_EXPORT_INCLUDE_PII"] === "true" });
      const { blob, filename } = await buildGymExport(c.db, gym);
      return new Response(blob, {
        headers: { "content-type": "application/zip", "content-disposition": `attachment; filename="${filename}"`, "cache-control": "no-store" },
      });
    },
  },

  "delete-gym": {
    kind: "heavy",
    run: async (c, body) => {
      const i = z.object({ gym_id: uuid, confirm_name: z.string().max(200) }).parse(body);
      const gym = await getGym(c, i.gym_id);
      if (gym.status !== "suspended") throw new HttpError(409, "Pehle gym suspend karein");
      if (i.confirm_name !== gym.name) throw new HttpError(400, "Gym ka naam match nahi hua");
      await audit(c, "delete_gym_start", gym.id, { name: gym.name });
      const files = await purgeStorage(c, gym.id); // fail ho to gym waisa hi, dobara try safe
      const { data: uids, error } = await c.db.rpc("admin_delete_gym_data", { p_admin: c.adminId, p_gym: gym.id });
      if (error) return rpcFail(error);
      const failed: string[] = [];
      for (const uid of (uids as string[]) ?? []) {
        const { error: de } = await c.db.auth.admin.deleteUser(uid);
        if (de) failed.push(uid);
      }
      await audit(c, "delete_gym_done", gym.id, {
        name: gym.name, storage_files_deleted: files, auth_users_deleted: ((uids as string[]) ?? []).length - failed.length, auth_users_failed: failed,
      });
      return { ok: true, auth_users_failed: failed.length };
    },
  },
};

function errorResponse(e: unknown): Response {
  if (e instanceof HttpError) return json({ error: e.message }, e.status, e.status === 429 ? { "retry-after": "60" } : {});
  if (e instanceof z.ZodError) return json({ error: e.issues[0]?.message ?? "Invalid input" }, 400);
  console.error("[admin]", e);
  return json({ error: "Server error" }, 500);
}

export async function handleAction(action: string, request: Request): Promise<Response> {
  try {
    const def = Object.hasOwn(A, action) ? A[action] : undefined;
    const ctx = await requireAdmin(request, def?.kind ?? "read"); // PEHLI cheez: JWT + platform_admins + MFA
    if (request.method !== "POST") throw new HttpError(405, "POST only");
    if (!def) throw new HttpError(404, "Unknown action");
    if (Number(request.headers.get("content-length") ?? 0) > 10_000) throw new HttpError(413, "Too large");
    const out = await def.run(ctx, await request.json().catch(() => ({})));
    return out instanceof Response ? out : json(out);
  } catch (e) {
    return errorResponse(e);
  }
}
