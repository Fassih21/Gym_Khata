# GymKhata Admin Panel (isi project ke andar)

- UI: `/admin` (login: `/admin/login`). API: `/api/admin/<action>`. Customer app ke pages/RLS untouched.
- Server code sirf `src/admin-server/*.server.ts` mein. `SUPABASE_SERVICE_ROLE_KEY` sirf server env se parhi jati hai (VITE_ prefix kabhi nahi).
- Admin ka session alag (`gymkhata-admin-auth`), customer session se koi mel nahi.
- Har request: JWT verify -> `platform_admins` -> MFA (aal2) -> rate limit. Har failure par 403. Audit log insert-only.

## Setup
1. Supabase SQL editor: `migration_admin.sql` chalayein (idempotent). `migration_plans.sql` pehle chal chuki ho to dobara zaroori nahi.
2. Auth settings mein TOTP MFA enable.
3. Server env: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY, ADMIN_REQUIRE_MFA=true, ADMIN_EXPORT_INCLUDE_PII=false.
4. Admin user banayein, phir `insert into public.platform_admins(user_id) values ('<uid>');`
5. `/admin/login`: email+password, pehli baar QR scan, phir 6-digit code.

## Test (real Supabase par, sirf test gym par)
1. Gym owner ke token se `/api/admin/list-gyms` -> 403. Owner `/admin/login` par -> "Access denied".
2. Create gym (weak password 400, duplicate email 409), suspend/resume, extend, reset password.
3. Delete: active par 409, galat naam 400, export ZIP, phir sahi naam se delete (rows, storage, owner user gayab).
4. Build ke baad `grep -r "<service role key ka prefix>" .output/public` -> kuch nahi milna chahiye.
5. Admin host par Cloudflare rate-limit rule bhi lagayein (in-memory limit per instance hai).
