import { describe, expect, it } from "vitest";

process.env["SUPABASE_URL"] = "http://127.0.0.1:9"; // unreachable: koi real call nahi
process.env["SUPABASE_SERVICE_ROLE_KEY"] = "CANARY_service_role";

const call = async (action: string, auth?: string, method = "POST") => {
  const { handleAction } = await import("./actions.server");
  const headers: Record<string, string> = { "content-type": "application/json", "x-forwarded-for": `9.9.9.${Math.floor(Math.random() * 250)}` };
  if (auth) headers["authorization"] = auth;
  return handleAction(action, new Request("http://x/api/admin/" + action, { method, headers, ...(method === "POST" ? { body: "{}" } : {}) }));
};

describe("admin guard fails closed", () => {
  it.each([
    ["no token", undefined],
    ["garbage", "Bearer abc"],
    ["fake jwt", "Bearer aaa.bbb.ccc"],
  ])("%s => 403", async (_n, a) => {
    for (const act of ["list-gyms", "delete-gym", "create-gym", "reset-password", "export-gym", "me", "__proto__"]) {
      const r = await call(act, a);
      expect([403, 404]).toContain(r.status);
      expect(await r.text()).not.toContain("CANARY");
    }
  });
  it("GET also denied", async () => {
    expect((await call("me", undefined, "GET")).status).toBeGreaterThanOrEqual(403);
  });
});
