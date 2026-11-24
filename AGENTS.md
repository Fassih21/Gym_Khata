## PROJECT RULES (Gym Khata)

### Repo status
- This repo started from a Lovable scaffold but is now an independent repo. Codex is the main builder.
- Never rewrite git history (no force push, rebase, amend on pushed commits).
- Stack: TanStack Start + TypeScript, Tailwind, shadcn/ui, Supabase, Cloudflare Workers.

### Database migrations (IMPORTANT)
- I run migrations manually in Lovable's Supabase SQL editor. Codex cannot run them.
- If a task needs any DB change (table, column, index, RLS policy, function, view):
  1. Do NOT assume it exists. Do NOT edit schema.sql silently.
  2. Give me the SQL in a separate fenced ```sql block, labeled "MIGRATION - run this first".
  3. Make it idempotent (use IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS) so running twice is safe.
  4. Include RLS policies for every new table.
  5. Also save it as a new file migration_<short_name>.sql in repo root (like existing migration_*.sql files), and update src/integrations/supabase types/src/lib/db-types.ts if needed.
  6. Tell me clearly: "Run the migration, then tell me when done" and STOP before building code that depends on it.
- Never put SERVICE_ROLE key in frontend code. Never commit .env.

### Working style
- Build one feature at a time, small steps.
- After each step run `npm run build` and `npm run lint`, fix errors.
- Do not touch existing features unless the task says so.
- At the end, list all files created/changed, and any migration I need to run.
- Roman Urdu/English mix is fine in UI copy for Pakistani gym owners; currency is PKR.