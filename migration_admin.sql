-- =============================================================================
-- GymKhata migration.sql — Platform Admin Panel   (idempotent; Supabase SQL editor mein poora chalayein)
-- Customer app ke RLS/policies/tables untouched. Sirf: gyms.plan column, 3 naye tables
-- (platform_admins, admin_audit_log, gym_billing_notes — sab RLS on, authenticated ko ZERO policy)
-- aur SECURITY DEFINER functions jo SIRF service_role chala sakta hai.
-- Pichli migration: migration_plans.sql (membership plans) — dobara chalane ki zarurat nahi.
-- Requires: schema.sql + migration_plans.sql
-- =============================================================================

-- 0) gyms.plan (SaaS plan jo platform owner set karta hai) -----------------------
alter table public.gyms add column if not exists plan text not null default 'standard'
  check (char_length(btrim(plan)) between 1 and 40);

-- 1) platform_admins -------------------------------------------------------------
create table if not exists public.platform_admins (
  user_id    uuid primary key,
  created_at timestamptz not null default now()
);
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'platform_admins_user_fk') then
    alter table public.platform_admins
      add constraint platform_admins_user_fk foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
exception when others then
  raise notice 'FK to auth.users skip hua (platform rule?): % — table bina FK ke chalega', sqlerrm;
end $$;

alter table public.platform_admins enable row level security;
alter table public.platform_admins force row level security;
revoke all on public.platform_admins from public, anon, authenticated;
grant select, insert, update, delete on public.platform_admins to service_role;
-- Koi policy nahi => client (anon/authenticated) na read kar sakta hai na write.

-- 2) admin_audit_log (insert-only) -------------------------------------------------
create table if not exists public.admin_audit_log (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid not null,
  action     text not null check (char_length(action) between 1 and 60),
  gym_id     uuid,                                   -- bina FK: gym delete ke baad bhi log rahe
  details    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_gym_idx on public.admin_audit_log (gym_id, created_at desc);

create or replace function public.admin_audit_log_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'admin_audit_log insert-only hai';
end $$;
drop trigger if exists admin_audit_log_no_change on public.admin_audit_log;
create trigger admin_audit_log_no_change before update or delete on public.admin_audit_log
  for each row execute function public.admin_audit_log_immutable();
drop trigger if exists admin_audit_log_no_truncate on public.admin_audit_log;
create trigger admin_audit_log_no_truncate before truncate on public.admin_audit_log
  for each statement execute function public.admin_audit_log_immutable();

alter table public.admin_audit_log enable row level security;
alter table public.admin_audit_log force row level security;
revoke all on public.admin_audit_log from public, anon, authenticated;
grant select, insert on public.admin_audit_log to service_role;   -- update/delete/truncate kisi ko nahi

-- 3) gym_billing_notes -------------------------------------------------------------
create table if not exists public.gym_billing_notes (
  id          uuid primary key default gen_random_uuid(),
  gym_id      uuid not null,                         -- bina FK: gym delete ke baad bhi accounting record rahe
  gym_name    text not null,
  admin_id    uuid not null,
  amount      numeric(12,2) not null check (amount >= 0),
  method      text not null check (char_length(btrim(method)) between 1 and 40),
  note        text check (char_length(note) <= 500),
  old_ends_on date not null,
  new_ends_on date not null,
  created_at  timestamptz not null default now()
);
create index if not exists gym_billing_notes_gym_idx on public.gym_billing_notes (gym_id, created_at desc);

alter table public.gym_billing_notes enable row level security;
alter table public.gym_billing_notes force row level security;
revoke all on public.gym_billing_notes from public, anon, authenticated;
grant select, insert on public.gym_billing_notes to service_role;

-- 4) Admin functions (SECURITY DEFINER, sirf service_role) ------------------------------
drop function if exists public.admin_audit(uuid, text, uuid, jsonb);
drop function if exists public.admin_list_gyms();
drop function if exists public.admin_create_gym(uuid, text, uuid, text, text, date);
drop function if exists public.admin_set_gym_status(uuid, uuid, text);
drop function if exists public.admin_extend_subscription(uuid, uuid, date, numeric, text, text);
drop function if exists public.admin_delete_gym_data(uuid, uuid);

create function public.admin_audit(p_admin uuid, p_action text, p_gym uuid, p_details jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.admin_audit_log (admin_id, action, gym_id, details)
  values (p_admin, p_action, p_gym, coalesce(p_details, '{}'::jsonb));
$$;

-- Sirf counts — members ka koi personal data nahi.
create function public.admin_list_gyms()
returns table (id uuid, name text, status text, plan text, subscription_ends_on date, days_left integer,
               members_count bigint, created_at timestamptz, last_sign_in_at timestamptz, owner_email text)
language sql stable security definer set search_path = public as $$
  select g.id, g.name, g.status, g.plan, g.subscription_ends_on,
         (g.subscription_ends_on - current_date)::int,
         (select count(*) from public.members m where m.gym_id = g.id and m.deleted_at is null),
         g.created_at,
         (select max(au.last_sign_in_at) from public.gym_users gu
            join auth.users au on au.id = gu.user_id where gu.gym_id = g.id),
         (select au.email::text from public.gym_users gu
            join auth.users au on au.id = gu.user_id
           where gu.gym_id = g.id and gu.role = 'owner' order by gu.created_at limit 1)
  from public.gyms g
  order by g.created_at desc
  limit 2000;
$$;

-- gyms + gym_users ek hi transaction mein (auth user ka cleanup server karta hai).
create function public.admin_create_gym(p_admin uuid, p_name text, p_user uuid, p_email text, p_plan text, p_ends_on date)
returns uuid language plpgsql security definer set search_path = public as $$
declare g uuid;
begin
  insert into public.gyms (name, status, plan, subscription_ends_on)
  values (btrim(p_name), 'active', btrim(p_plan), p_ends_on) returning id into g;
  insert into public.gym_users (user_id, gym_id, role) values (p_user, g, 'owner');
  perform public.admin_audit(p_admin, 'create_gym', g, jsonb_build_object(
    'name', btrim(p_name), 'plan', btrim(p_plan), 'subscription_ends_on', p_ends_on,
    'owner_user_id', p_user, 'owner_email', p_email));
  return g;
end $$;

create function public.admin_set_gym_status(p_admin uuid, p_gym uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare old_status text;
begin
  if p_status not in ('active', 'suspended') then raise exception 'bad status'; end if;
  select status into old_status from public.gyms where id = p_gym for update;
  if not found then raise exception 'gym not found' using errcode = 'P0002'; end if;
  update public.gyms set status = p_status where id = p_gym;
  perform public.admin_audit(p_admin, case when p_status = 'suspended' then 'suspend_gym' else 'resume_gym' end,
    p_gym, jsonb_build_object('from', old_status, 'to', p_status));
end $$;

create function public.admin_extend_subscription(p_admin uuid, p_gym uuid, p_new_ends_on date,
                                                 p_amount numeric, p_method text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare g public.gyms%rowtype;
begin
  select * into g from public.gyms where id = p_gym for update;
  if not found then raise exception 'gym not found' using errcode = 'P0002'; end if;
  update public.gyms set subscription_ends_on = p_new_ends_on where id = p_gym;
  insert into public.gym_billing_notes (gym_id, gym_name, admin_id, amount, method, note, old_ends_on, new_ends_on)
  values (p_gym, g.name, p_admin, p_amount, btrim(p_method), nullif(btrim(p_note), ''), g.subscription_ends_on, p_new_ends_on);
  perform public.admin_audit(p_admin, 'extend_subscription', p_gym, jsonb_build_object(
    'from', g.subscription_ends_on, 'to', p_new_ends_on, 'amount', p_amount, 'method', btrim(p_method)));
end $$;

-- Gym ki saari rows FK order se, ek transaction mein. Returns: sirf is gym ke auth user ids
-- (jo kisi aur gym mein nahi aur platform admin nahi) — server inhe auth se hata deta hai.
create function public.admin_delete_gym_data(p_admin uuid, p_gym uuid)
returns uuid[] language plpgsql security definer set search_path = public as $$
declare g public.gyms%rowtype; uids uuid[];
begin
  select * into g from public.gyms where id = p_gym for update;
  if not found then raise exception 'gym not found' using errcode = 'P0002'; end if;
  if g.status <> 'suspended' then raise exception 'gym pehle suspend karein' using errcode = 'P0001'; end if;

  select coalesce(array_agg(gu.user_id), '{}') into uids from public.gym_users gu
   where gu.gym_id = p_gym
     and not exists (select 1 from public.gym_users o where o.user_id = gu.user_id and o.gym_id <> p_gym)
     and not exists (select 1 from public.platform_admins pa where pa.user_id = gu.user_id);

  delete from public.member_payments     where gym_id = p_gym;
  delete from public.employee_attendance where gym_id = p_gym;
  delete from public.salary_payments     where gym_id = p_gym;
  delete from public.expenses            where gym_id = p_gym;
  delete from public.members             where gym_id = p_gym;
  delete from public.employees           where gym_id = p_gym;
  delete from public.membership_plans    where gym_id = p_gym;
  delete from public.gym_users           where gym_id = p_gym;
  delete from public.gyms                where id = p_gym;

  perform public.admin_audit(p_admin, 'delete_gym_rows', p_gym,
    jsonb_build_object('name', g.name, 'auth_users_pending_delete', coalesce(array_length(uids, 1), 0)));
  return uids;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'admin_audit(uuid,text,uuid,jsonb)', 'admin_list_gyms()',
    'admin_create_gym(uuid,text,uuid,text,text,date)', 'admin_set_gym_status(uuid,uuid,text)',
    'admin_extend_subscription(uuid,uuid,date,numeric,text,text)', 'admin_delete_gym_data(uuid,uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

-- 5) Pehla platform admin (apna auth user pehle Auth dashboard mein banayein, phir):
-- insert into public.platform_admins (user_id)
--   select id from auth.users where email = '<YOUR EMAIL>' on conflict do nothing;

-- Verify (teeno tables par authenticated ke liye 0 policies aani chahiye):
-- select tablename, policyname from pg_policies
--  where tablename in ('platform_admins','admin_audit_log','gym_billing_notes');
