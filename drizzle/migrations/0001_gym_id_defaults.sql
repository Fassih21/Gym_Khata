alter table public.members alter column gym_id set default public.current_gym_id();
alter table public.member_payments alter column gym_id set default public.current_gym_id();
alter table public.expenses alter column gym_id set default public.current_gym_id();
alter table public.employees alter column gym_id set default public.current_gym_id();
alter table public.salary_payments alter column gym_id set default public.current_gym_id();
alter table public.employee_attendance alter column gym_id set default public.current_gym_id();
