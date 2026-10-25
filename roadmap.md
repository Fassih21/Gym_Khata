# GymKhata — roadmap

Done this session:
- [x] Lovable Cloud enabled; email/password sign-in on
- [x] Schema migration applied: gyms, gym_users, members, member_payments, expenses, employees, salary_payments, employee_attendance — all with gym_id, constraints, indexes, unique (member_id/employee_id, month)
- [x] Security: RLS on every table, policies per operation gated on current_gym_id() + is_gym_active() (security definer helpers), grants only to authenticated, anon revoked, photos storage policies ({gym_id}/members|employees/*)
- [x] Private `photos` bucket created (2MB limit)
- [x] Design system: charcoal + saffron, Manrope + Bebas Neue, light/dark tokens (src/styles.css)
- [x] __root (fonts, branded 404/error, SIGNED_OUT handler), / (splash redirect), /login, /_authenticated gate + AppShell (sidebar, bottom nav, subscription gate)

Remaining (next turn):
- [ ] Pages: dashboard (month stats + 6-month chart), members (list/add/edit/soft-delete, photo upload), fees (paid/unpaid, mark-paid dialog, undo, WhatsApp reminders, unpaid filter), employees (list/add, mark salary paid), attendance (daily mark + monthly summary), expenses (CRUD + month filter + total), reports (summary + CSV exports), settings (gym name, subscription, logout)
- [ ] Shared UI: month select (done), photo input component, stat cards
- [ ] src/test: add format.test.ts (PKR format Rs 3,000, phone normalization, month keys)
- [ ] Deliverables to Files: schema.sql copy, onboarding.sql, suspend_gym.sql, rls_test.sql, README
- [ ] Set real support WhatsApp number in src/lib/config.ts (placeholder 923001234567)
- [ ] End-to-end verify with a seeded gym + test user

Updated this turn:
- [x] deleted_at filter bug fixed everywhere (.is("deleted_at", null), removed `as never`)
- [x] /attendance, /reports, /settings pages created (build green)
- [x] schema.sql, onboarding.sql, suspend_gym.sql, rls_test.sql, README written
