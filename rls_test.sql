-- =============================================================================
-- GymKhata — RLS isolation test
-- Goal: prove Gym A's user cannot read or write Gym B's data.
-- Run as two separate SQL sessions, each logged in / impersonating a user
-- from a DIFFERENT gym. Easiest: run each block with
--   set local role authenticated; set local request.jwt.claims = '{"sub":"<USER_UUID>"}';
-- inside a transaction (SQL editor "As user" runs also work).
-- =============================================================================

-- Setup (admin): create two gyms with one user each, plus a decoy row in gym B.
begin;
  -- impersonate Gym A's owner
  set local role authenticated;
  set local request.jwt.claims = $${"sub": "<USER_A_UUID>"}$$;

  -- 1. Must return ONLY gym A rows (expect 0 gym-B rows)
  select count(*) as gym_b_members_visible
  from public.members m
  join public.gym_users gu on gu.user_id = auth.uid() and gu.gym_id <> m.gym_id;
  -- PASS if gym_b_members_visible = 0

  -- 2. Cross-gym select by id must return nothing
  select * from public.members where gym_id = '<GYM_B_UUID>';
  -- PASS if 0 rows

  -- 3. Cross-gym insert must fail
  insert into public.members (gym_id, name, phone, join_date)
  values ('<GYM_B_UUID>', 'Hacker', '0300-0000000', current_date);
  -- PASS if this throws "new row violates row-level security policy"

  -- 4. Cross-gym update must affect 0 rows
  update public.members set name = 'Hacked' where gym_id = '<GYM_B_UUID>';
  -- PASS if 0 rows updated

  -- 5. Cross-gym payment insert must fail (FK + RLS)
  insert into public.member_payments (member_id, month, amount_paid)
  select id, date_trunc('month', current_date)::date, 1000
  from public.members where gym_id = '<GYM_B_UUID>' limit 1;
  -- PASS if this throws

  -- 6. Suspended gym: flip your own gym's status (admin) then
  select * from public.members limit 1;
  -- PASS if 0 rows (is_gym_active() false blocks everything)

  -- 7. gyms/gym_users are read-only:
  update public.gyms set status = 'suspended' where id = public.current_gym_id();
  -- PASS if this throws / affects 0 rows

  -- 8. User cannot change their gym linkage:
  update public.gym_users set gym_id = '<GYM_B_UUID>' where user_id = auth.uid();
  -- PASS if this throws / affects 0 rows

rollback;
