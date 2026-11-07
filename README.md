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
| Unit tests | Vitest |
| End-to-end tests | Playwright |

## Project layout

```
src/
  routes/             pages (dashboard, members, fees, employees, expenses, reports, settings, admin)
  routes/_authenticated/   screens that need a signed-in gym user
  lib/fees.ts         fee status logic (paid, due, overdue, expired, covered)
  lib/format.ts       dates, PKR, WhatsApp links
  admin-server/       server-only admin actions (service role key lives here only)
  integrations/supabase/   client and generated types
e2e/                  Playwright end-to-end tests
  auth.setup.ts       logs in once and saves the session
  helpers.ts          shared helpers (login, addMember, feeRow, ...)
  login.spec.ts       login and route protection
  members-fees.spec.ts   fee and expiry rules
  isolation.spec.ts   gym-to-gym data isolation
playwright.config.ts  Playwright projects and dev server config
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
| `E2E_EMAIL`, `E2E_PASSWORD` | `.env.test` only | login of the test gym (Gym A) for Playwright |
| `E2E_EMAIL_B`, `E2E_PASSWORD_B` | `.env.test` only | optional second gym; without it the isolation test is skipped |

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
npm test             # unit tests (Vitest)
npm run e2e:ui       # Playwright UI mode
npx tsc --noEmit     # type check
npm run lint         # lint
npm run format       # prettier
```

## End-to-end testing (Playwright)

Playwright drives a real browser against the running app and checks the rules that matter most: fees, expiry dates, login, and gym-to-gym data isolation.

### One-time setup

```bash
npm ci
npx playwright install chromium
cp .env.test.example .env.test    # then fill in the test gym login
```

`.env.test` holds a real login, so it is **never committed** (it is in `.gitignore`):

```
E2E_EMAIL=gymA@test.com
E2E_PASSWORD=your-test-password
# Optional: a second gym for the isolation test
E2E_EMAIL_B=
E2E_PASSWORD_B=
```

Quote the password if it contains `#` (for example `E2E_PASSWORD="abc#123"`), otherwise dotenv treats `#` as a comment.

Use a dedicated test gym, not a real customer's gym. The tests create and delete members.

### Projects

| Project | What it runs |
|---|---|
| `setup` | `auth.setup.ts`: logs in as Gym A and saves the session to `e2e/.auth/gymA.json` |
| `mobile` | fee and expiry tests and the isolation test, on a mobile viewport, using the saved session |
| `login` | login success, wrong password, and protected pages without login |

### Running tests

```bash
npm run e2e:ui                                   # interactive UI mode (easiest)
npx playwright test                              # everything, headless
npx playwright test --project=login             # login tests only
npx playwright test --project=mobile            # fees and isolation tests
npx playwright test --project=mobile --headed   # watch the browser
npx playwright show-report                       # open the last HTML report
```

Playwright starts the dev server itself (`webServer` in `playwright.config.ts`). If port 8080 is already used by an old server, stop it first, otherwise tests may run against a different instance.

### If login in the setup test fails

Save a session by hand instead, then skip the setup project:

```bash
mkdir e2e\.auth
npx playwright codegen --save-storage=e2e/.auth/gymA.json http://localhost:8080/login
npx playwright test --project=mobile --no-deps
```

Log in in the window that opens, wait for the dashboard, then close the browser window. The session file is written when the browser closes. Repeat if the session expires.

### What is covered

| Test | Rule it protects |
|---|---|
| New member with fee | expiry is join date plus one month |
| New member without fee, then first payment | the first payment does not extend expiry a second time |
| Payment undo (void), then pay again | one live payment per member per month still works |
| Gym B cannot see Gym A's members | row level security keeps gyms apart (needs the Gym B login) |
| Login and protected routes | wrong password is rejected, inner pages need a login |

Tests that depend on today's date are skipped on the 29th to 31st of a month, where month-end date math differs.

### Test data cleanup

Test members are named `QA-fee-…`, `QA-nofee-…` and `QA-void-…`. The fees spec deletes the members it creates after each test. If a run is stopped halfway, delete leftover `QA-*` members from the Members page.

### CI

`.github/workflows/playwright.yml` runs the Playwright tests on push. Add `E2E_EMAIL` and `E2E_PASSWORD` (and the Supabase variables) as GitHub repository secrets. Never put them in the workflow file.

## Deploy

```bash
npm run build
npx wrangler deploy
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Roll back a bad release with `npx wrangler rollback`.

The Cloudflare build installs with `bun install --frozen-lockfile`. After adding or changing any dependency, run `bun install` and commit `bun.lock`, otherwise the build fails with a lockfile mismatch.

## Security model

- Every business table carries `gym_id` and is protected by Row Level Security; a gym can never read another gym's rows.
- No public sign-up. Accounts are created by the operator.
- Payments are never deleted, only voided with a reason; voided rows are locked.
- The service role key exists only in server code and is never bundled for the browser.
- Admin routes verify the session, platform-admin membership, MFA, and a rate limit on every request.
- Test credentials (`.env.test`) and saved sessions (`e2e/.auth/`) are git-ignored and must never be committed.

## Fee logic in one paragraph

A member is **paid** for a month if that month has a live payment. Quarterly and yearly members are **covered** for months between their first payment and expiry. A member whose expiry has passed in the current month shows as **expired** and moves to the unpaid list until renewed. A new member's expiry is join date plus the plan length, and their first payment does not extend it again; later payments extend from the current expiry. "Today" is Pakistan time on the database side.
