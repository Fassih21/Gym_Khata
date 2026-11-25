# GymKhata

GymKhata is a multi-tenant gym management app built for Pakistani gym owners. It keeps members, fees, attendance, employees, expenses, and reports in one place, with PKR formatting and practical Roman Urdu/English copy.

Each gym has its own login and can access only its own records through Supabase Row Level Security (RLS).

## Features

- Member registration, plans, expiry tracking, search, and active/inactive history
- Monthly fee collection, due/overdue status, renewals, voided payments, and WhatsApp reminders
- Monthly, quarterly, half-yearly, yearly, and custom membership plans
- Member attendance with monthly summaries
- Employee records, attendance, salary payments, and employment history
- Expense tracking, dashboard totals, profit reporting, and CSV exports
- Password changes and full gym data export from Settings
- Platform admin panel for gym onboarding, suspension, plan management, audit logs, and exports
- Public marketing pages for product information, pricing, FAQs, and contact

## Tech stack

| Area       | Technology                                                    |
| ---------- | ------------------------------------------------------------- |
| App        | React 19, TypeScript, TanStack Start, TanStack Router         |
| UI         | Tailwind CSS, shadcn/ui, Radix UI, Framer Motion              |
| Data       | Supabase Auth, PostgreSQL, Row Level Security, TanStack Query |
| Validation | Zod, React Hook Form                                          |
| Hosting    | Cloudflare Workers                                            |
| Testing    | Vitest, Testing Library, Playwright                           |

## Local development

### Prerequisites

- Node.js (current LTS recommended)
- npm
- Access to a configured Supabase project

Install dependencies:

```bash
npm ci
```

Create a local `.env` file (it is ignored by Git):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# Required only for server-side admin operations. Never expose this as VITE_*.
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

ADMIN_REQUIRE_MFA=true
ADMIN_EXPORT_INCLUDE_PII=false
```

Start the development server:

```bash
npm run dev
```

## Available scripts

| Command              | Purpose                             |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Start the local development server  |
| `npm run build`      | Create a production build           |
| `npm run preview`    | Preview the production build        |
| `npm run lint`       | Run ESLint                          |
| `npm run format`     | Format the repository with Prettier |
| `npm test`           | Run the Vitest suite once           |
| `npm run test:watch` | Run Vitest in watch mode            |
| `npm run e2e`        | Run Playwright end-to-end tests     |
| `npm run e2e:ui`     | Open Playwright UI mode             |
| `npm run e2e:report` | Open the latest Playwright report   |

## End-to-end tests

Use dedicated test gyms because the Playwright suite creates and removes test data.

```bash
cp .env.test.example .env.test
npx playwright install chromium
npm run e2e
```

Fill `.env.test` with the primary test gym credentials. A second gym is optional and enables the tenant-isolation test:

```env
E2E_EMAIL=gym-a@example.com
E2E_PASSWORD=your-test-password
E2E_EMAIL_B=gym-b@example.com
E2E_PASSWORD_B=your-second-test-password
```

`.env.test`, saved browser sessions, test results, and Playwright reports are ignored by Git.

## Database setup and migrations

Database SQL is applied manually in the Supabase SQL editor. Do not assume a migration has already been run.

- `schema.sql` contains the baseline multi-tenant schema, functions, indexes, storage rules, and RLS policies.
- `migration_plans.sql` adds membership plan support.
- `migration_admin.sql` adds the platform-admin data model and policies.
- `onboarding.sql` provisions a gym and owner account.
- `suspend_gym.sql` contains gym suspension/resumption operations.
- `rls_test.sql` and `tests/*.sql` verify database isolation and behavior.
- New database changes are added as idempotent `migration_<name>.sql` files in the repository root and run manually before dependent application code is deployed.

Never place `SUPABASE_SERVICE_ROLE_KEY` in frontend code, any `VITE_*` variable, or a committed file.

## Project structure

```text
src/
  admin-server/              Server-only platform admin operations
  components/                App, marketing, and shadcn/ui components
  hooks/                     Gym, plan, payment, photo, and responsive hooks
  integrations/supabase/     Supabase clients, auth middleware, and generated types
  lib/                       Fee logic, formatting, queries, exports, and schemas
  routes/                    TanStack file-based routes
    _authenticated/          Protected gym-owner pages
    _marketing/              Public marketing pages
    admin/                   Platform admin interface
e2e/                         Playwright tests and helpers
drizzle/                     Drizzle schema and generated migration history
tests/                       SQL database tests
public/                      Static assets
```

## Admin panel

The platform admin interface is available at `/admin` and uses a separate session from the gym-owner app. Every admin request verifies the user, platform-admin membership, MFA level, and rate limits.

See [ADMIN.md](./ADMIN.md) for setup and operational checks.

## Deployment

Build and deploy to Cloudflare Workers:

```bash
npm run build
npx wrangler deploy
```

Store the service-role key as a Cloudflare secret, never as a public Wrangler variable:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

`wrangler.jsonc` contains the Worker entry point, static asset binding, compatibility settings, and non-secret runtime configuration.

## Security model

- Business data is scoped by `gym_id` and protected by Supabase RLS.
- Public sign-up is disabled; accounts are provisioned by the operator.
- Payments are voided with a reason instead of being silently deleted.
- Service-role access is restricted to server-only modules.
- Admin actions require platform-admin membership and MFA by default.
- Environment files, test credentials, browser sessions, and generated reports are not committed.
