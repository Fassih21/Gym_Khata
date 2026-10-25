# GymKhata

Gym management SaaS for Pakistani gyms. Multi-tenant: one database, many gyms; every business row is scoped by `gym_id` and protected by row-level security. Currency PKR (`Rs 3,000`), phone format `03XX-XXXXXXX`.

## Features
- **Dashboard** — month stats (revenue, expenses, net) + 6-month chart
- **Members** — list, add/edit, photo, soft delete
- **Fees** — paid/unpaid per month, mark paid, undo, WhatsApp reminders
- **Employees** — list, add, mark salary paid
- **Attendance** — daily present/absent/leave + monthly summary
- **Expenses** — CRUD with month filter and total
- **Reports** — monthly summary + CSV exports (dues, payments, expenses)
- **Settings** — gym name (read-only), subscription end date, logout

Suspended/expired gyms are blocked at the database level (RLS), not just in the UI.

## Onboard a customer
1. Create/confirm the owner's auth user via the Auth page (there is no public signup).
2. Open `onboarding.sql`, replace `<GYM NAME>` and `<OWNER EMAIL>`, run it in the SQL editor.

## Suspend / resume / renew
Use `suspend_gym.sql` (also has resume and +30-days snippets).

## Run the security test
`rls_test.sql` walks through the isolation checklist: cross-gym reads, inserts, updates, payment writes, suspended-gym blocking, and read-only `gyms`/`gym_users`. Each step has a PASS condition in a comment.

## Schema
`schema.sql` is the full schema: tables, constraints, indexes, `current_gym_id()` / `is_gym_active()` helpers, per-operation RLS policies, and photo storage policies. Photos live in the private `photos` bucket as `{gym_id}/members|employees/{uuid}.jpg`, shown via signed URLs.

## Configuration
Support WhatsApp number: `src/lib/config.ts` (currently a placeholder — replace `SUPPORT_WHATSAPP`).
