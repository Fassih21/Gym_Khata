-- =============================================================================
-- GymKhata — Onboard a new customer
-- Run in the SQL editor. Replace the bracketed values first.
-- =============================================================================

-- 1. Create the auth user (no public signup in the app).
--    In the SQL editor, insert directly into auth.users:
select id, email from auth.users where email = 'owner@newgym.pk';
-- If the user does not exist yet, create it via the Auth admin page or
-- invite them by email, then confirm the email.

-- 2. Create the gym and link the user as owner.
do $$
declare
  g_id uuid;
  u_id uuid;
begin
  insert into public.gyms (name, status, subscription_ends_on)
  values ('<GYM NAME>', 'active', current_date + interval '30 days')
  returning id into g_id;

  select id into u_id from auth.users where email = '<OWNER EMAIL>' limit 1;
  if u_id is null then
    raise exception 'Auth user not found: create/confirm it first';
  end if;

  insert into public.gym_users (user_id, gym_id, role) values (u_id, g_id, 'owner');
end $$;

-- 3. (Optional) Pre-seed an employee or two:
-- insert into public.employees (name, phone, monthly_salary, role_title)
-- values ('Ahmed', '0332-1234567', 40000, 'Trainer');

-- Verify:
-- select * from public.gyms where name = '<GYM NAME>';
-- select * from public.gym_users join public.gyms on gyms.id = gym_users.gym_id;
