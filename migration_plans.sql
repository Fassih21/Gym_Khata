-- =============================================================================
-- GymKhata migration.sql — Membership plans + expiry   (idempotent)
-- Supabase SQL editor mein poora chalayein. Purana data/RLS/policies untouched;
-- purane members ke plan_id / membership_expires_on NULL rehte hain.
-- (Pichli migration: migration_prev.sql — dobara chalane ki zarurat nahi.)
-- Requires: public.current_gym_id(), public.is_gym_active(), public.touch_updated_at() (schema.sql)
-- Feature 1 (overdue) aur Feature 3 (export) ko koi DB change nahi chahiye.
-- =============================================================================

-- 1) membership_plans -----------------------------------------------------------
create table if not exists public.membership_plans (
  id              uuid primary key default gen_random_uuid(),
  gym_id          uuid not null default public.current_gym_id()
                    references public.gyms (id) on delete cascade,
  name            text not null check (char_length(btrim(name)) between 1 and 60),
  duration_months integer not null check (duration_months > 0 and duration_months <= 120),
  price           numeric(10,2) not null check (price >= 0),
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (id, gym_id)          -- members se (plan_id, gym_id) composite FK ke liye
);

create index if not exists membership_plans_gym_id_idx on public.membership_plans (gym_id);
create index if not exists membership_plans_gym_active_idx on public.membership_plans (gym_id, active);
create unique index if not exists membership_plans_gym_name_uidx
  on public.membership_plans (gym_id, lower(btrim(name)));

drop trigger if exists membership_plans_touch_updated_at on public.membership_plans;
create trigger membership_plans_touch_updated_at before update on public.membership_plans
  for each row execute function public.touch_updated_at();

-- 2) Privileges + RLS ------------------------------------------------------------
revoke all on public.membership_plans from anon;
grant select, insert, update, delete on public.membership_plans to authenticated;
grant all on public.membership_plans to service_role;

alter table public.membership_plans enable row level security;

drop policy if exists "membership_plans_select_own_gym" on public.membership_plans;
create policy "membership_plans_select_own_gym"
  on public.membership_plans for select to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active());

drop policy if exists "membership_plans_insert_own_gym" on public.membership_plans;
create policy "membership_plans_insert_own_gym"
  on public.membership_plans for insert to authenticated
  with check (gym_id = public.current_gym_id() and public.is_gym_active());

drop policy if exists "membership_plans_update_own_gym" on public.membership_plans;
create policy "membership_plans_update_own_gym"
  on public.membership_plans for update to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active())
  with check (gym_id = public.current_gym_id() and public.is_gym_active());

drop policy if exists "membership_plans_delete_own_gym" on public.membership_plans;
create policy "membership_plans_delete_own_gym"
  on public.membership_plans for delete to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active());

-- 3) members: plan_id + membership_expires_on (nullable => purane rows safe) ------
alter table public.members add column if not exists plan_id uuid;
alter table public.members add column if not exists membership_expires_on date;

do $$
begin
  -- Composite FK: plan hamesha usi gym ka hona chahiye (cross-gym plan link impossible).
  -- plan_id NULL ho to FK check skip hota hai.
  if not exists (select 1 from pg_constraint where conname = 'members_plan_gym_fk') then
    alter table public.members
      add constraint members_plan_gym_fk
      foreign key (plan_id, gym_id) references public.membership_plans (id, gym_id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'members_expiry_after_join_chk') then
    alter table public.members
      add constraint members_expiry_after_join_chk
      check (membership_expires_on is null or membership_expires_on >= join_date);
  end if;
end $$;

create index if not exists members_plan_id_idx on public.members (plan_id) where plan_id is not null;
create index if not exists members_gym_expiry_idx
  on public.members (gym_id, membership_expires_on) where deleted_at is null;
