# GymKhata

Gym management for Pakistan. One app, many gyms: each gym gets its own login and sees only its own data.

Members and fees, plans and expiry, staff salary and attendance, expenses, and a daily dashboard, with Urdu-friendly (Roman Urdu) wording and PKR formatting.

## Features

- **Members**: add, edit, deactivate and reactivate (nothing is hard-deleted), search, join date, plan and expiry
- **Fees**: month-wise paid/unpaid view, partial-month coverage for quarterly and yearly plans, one-tap WhatsApp reminders, renew, and payment cancel (void) with a reason
- **Membership plans**: monthly, quarterly, half-yearly, yearly, custom price and duration
- **Employees**: salary payments, daily attendance, mark as left (kept in history)
- **Expenses**: categories, monthly totals, no double counting with salaries
- **Dashboard and reports**: collected, unpaid, expenses, profit, and CSV export per month
- **Full data export** from Settings, and in-app password change
- **Admin panel** (`/admin`): create, suspend, resume and delete gyms, audit log, MFA-protected (see `ADMIN.md`)

## Stack

| Layer | Tech |
|---|---|
| UI | React, TypeScript, Tailwind CSS |
| Routing and server | TanStack Start, TanStack Router, TanStack Query |
| Database and auth | Supabase (Postgres, Auth, Row Level Security) |
| Hosting | Cloudflare Workers |
| Tests | Vitest |

## Project layout

```
src/
  routes/             pages (dashboard, members, fees, employees, expenses, reports, settings, admin)
  routes/_authenticated/   screens that need a signed-in gym user
  lib/fees.ts         fee status logic (paid, due, overdue, expired, covered)
  lib/format.ts       dates, PKR, WhatsApp links
  admin-server/       server-only admin actions (service role key lives here only)
  integrations/supabase/   client and generated types
db/                   numbered SQL migrations (source of truth for the database)
tests/                database tests
wrangler.jsonc        Cloudflare Workers config
```

## Getting started

```bash
npm ci
cp .env.example .env     # fill in the values below
npm run dev
```

Environment variables:

| Name | Where | Notes |
|---|---|---|
| `SUPABASE_URL` | server and `wrangler.jsonc` | project URL |
| `SUPABASE_PUBLISHABLE_KEY` | server and `wrangler.jsonc` | public (anon) key |
| `VITE_SUPABASE_URL` | browser build | same URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser build | same public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **server secret only** | never put in `VITE_*`, never commit |
| `ADMIN_REQUIRE_MFA` | server | `true` in production |
| `ADMIN_EXPORT_INCLUDE_PII` | server | `false` by default |

## Database

Everything lives in `db/` and is applied in numeric order:

| File | Purpose |
|---|---|
| `001_base.sql` | tables, RLS, helper functions (new project only) |
| `002_plans.sql` | membership plans (new project only) |
| `003_admin.sql` | platform admins, audit log (new project only) |
| `004_logic.sql` | Pakistan time, payment void, one live payment per member per month |
| `005_rate_limit.sql` | per-gym insert rate limits |
| `006_hardening.sql` | privilege cleanup, admin list fix, unlimited default |
| `099_verify.sql` | sanity checks, every row must be `true` |
| `onboarding.sql` | create a gym and its owner login |

Rules: every schema change gets a new numbered file first, never edit an old one, and run `099_verify.sql` after each change.

## Adding a new gym

Edit the three values at the top of `db/onboarding.sql` (gym name, owner email, password) and run it in the SQL editor. It is safe to run twice. Ask the owner to change the password from Settings on first login.

Suspend or resume a gym:

```sql
update public.gyms set status = 'suspended' where name = '<GYM NAME>';
update public.gyms set status = 'active'    where name = '<GYM NAME>';
```

## Scripts

```bash
npm run dev          # local dev server
npm run build        # production build
npm test             # unit tests
npx tsc --noEmit     # type check
npm run lint         # lint
npm run format       # prettier
```

## Deploy

```bash
npm run build
npx wrangler deploy
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Roll back a bad release with `npx wrangler rollback`.

## Security model

- Every business table carries `gym_id` and is protected by Row Level Security; a gym can never read another gym's rows.
- No public sign-up. Accounts are created by the operator.
- Payments are never deleted, only voided with a reason; voided rows are locked.
- The service role key exists only in server code and is never bundled for the browser.
- Admin routes verify the session, platform-admin membership, MFA, and a rate limit on every request.

## Fee logic in one paragraph

A member is **paid** for a month if that month has a live payment. Quarterly and yearly members are **covered** for months between their first payment and expiry. A member whose expiry has passed in the current month shows as **expired** and moves to the unpaid list until renewed. "Today" is Pakistan time on the database side.