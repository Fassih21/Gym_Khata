-- =============================================================================
-- GymKhata schema — multi-tenant gym management (one database, many gyms)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tables (helpers that reference them are created afterwards)
-- -----------------------------------------------------------------------------

create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  status text not null default 'active' check (status in ('active', 'suspended')),
  subscription_ends_on date not null,
  created_at timestamptz not null default now()
);

-- user_id is an auth.users id stored as plain uuid (platform rule: no FK to auth schema)
create table public.gym_users (
  user_id uuid not null,
  gym_id uuid not null references public.gyms (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  primary key (user_id, gym_id)
);
create index gym_users_gym_id_idx on public.gym_users (gym_id);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  phone text not null check (phone ~ '^03[0-9]{2}-?[0-9]{7}$'),
  address text check (char_length(address) <= 300),
  photo_path text check (char_length(photo_path) <= 300),
  join_date date not null default current_date,
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text check (char_length(notes) <= 1000),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, gym_id)
);
create index members_gym_id_idx on public.members (gym_id) where deleted_at is null;
create index members_gym_status_idx on public.members (gym_id, status) where deleted_at is null;
create index members_gym_name_idx on public.members (gym_id, lower(name));

create table public.member_payments (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  member_id uuid not null,
  month date not null check (month = date_trunc('month', month)::date),
  amount_paid numeric(10,2) not null check (amount_paid >= 0),
  paid_on date not null default current_date,
  note text check (char_length(note) <= 300),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, month),
  foreign key (member_id, gym_id) references public.members (id, gym_id) on delete cascade
);
create index member_payments_gym_month_idx on public.member_payments (gym_id, month);
create index member_payments_member_idx on public.member_payments (member_id);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  category text not null check (category in ('Rent', 'Electricity', 'Equipment', 'Maintenance', 'Salaries', 'Other')),
  amount numeric(10,2) not null check (amount >= 0),
  expense_date date not null default current_date,
  note text check (char_length(note) <= 300),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index expenses_gym_date_idx on public.expenses (gym_id, expense_date);
create index expenses_gym_category_idx on public.expenses (gym_id, category);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  phone text not null check (phone ~ '^03[0-9]{2}-?[0-9]{7}$'),
  address text check (char_length(address) <= 300),
  photo_path text check (char_length(photo_path) <= 300),
  monthly_salary numeric(10,2) not null check (monthly_salary >= 0),
  role_title text check (char_length(role_title) <= 80),
  join_date date not null default current_date,
  status text not null default 'active' check (status in ('active', 'inactive')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, gym_id)
);
create index employees_gym_id_idx on public.employees (gym_id) where deleted_at is null;
create index employees_gym_status_idx on public.employees (gym_id, status) where deleted_at is null;

create table public.salary_payments (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  employee_id uuid not null,
  month date not null check (month = date_trunc('month', month)::date),
  amount_paid numeric(10,2) not null check (amount_paid >= 0),
  paid_on date not null default current_date,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, month),
  foreign key (employee_id, gym_id) references public.employees (id, gym_id) on delete cascade
);
create index salary_payments_gym_month_idx on public.salary_payments (gym_id, month);
create index salary_payments_employee_idx on public.salary_payments (employee_id);

create table public.employee_attendance (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  employee_id uuid not null,
  date date not null,
  status text not null check (status in ('present', 'absent', 'leave')),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, date),
  foreign key (employee_id, gym_id) references public.employees (id, gym_id) on delete cascade
);
create index employee_attendance_gym_date_idx on public.employee_attendance (gym_id, date);
create index employee_attendance_employee_idx on public.employee_attendance (employee_id);

-- -----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER, fixed search_path to avoid recursion)
-- -----------------------------------------------------------------------------

create or replace function public.current_gym_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select gu.gym_id
  from public.gym_users gu
  where gu.user_id = auth.uid()
  order by gu.created_at
  limit 1;
$$;

create or replace function public.is_gym_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.gyms g
    where g.id = public.current_gym_id()
      and g.status = 'active'
      and g.subscription_ends_on >= current_date
  );
$$;

revoke execute on function public.current_gym_id() from anon, public;
revoke execute on function public.is_gym_active() from anon, public;
grant execute on function public.current_gym_id() to authenticated;
grant execute on function public.is_gym_active() to authenticated;

-- updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger members_touch_updated_at before update on public.members
  for each row execute function public.touch_updated_at();
create trigger member_payments_touch_updated_at before update on public.member_payments
  for each row execute function public.touch_updated_at();
create trigger expenses_touch_updated_at before update on public.expenses
  for each row execute function public.touch_updated_at();
create trigger employees_touch_updated_at before update on public.employees
  for each row execute function public.touch_updated_at();
create trigger salary_payments_touch_updated_at before update on public.salary_payments
  for each row execute function public.touch_updated_at();
create trigger employee_attendance_touch_updated_at before update on public.employee_attendance
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Lock down privileges: nothing for anon, scoped grants for authenticated
-- -----------------------------------------------------------------------------

revoke all on public.gyms, public.gym_users, public.members, public.member_payments,
  public.expenses, public.employees, public.salary_payments, public.employee_attendance
  from anon;

grant select on public.gyms, public.gym_users to authenticated;
grant all on public.gyms, public.gym_users to service_role;

grant select, insert, update, delete on public.members, public.member_payments,
  public.expenses, public.employees, public.salary_payments, public.employee_attendance
  to authenticated;
grant all on public.members, public.member_payments, public.expenses, public.employees,
  public.salary_payments, public.employee_attendance to service_role;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.gyms enable row level security;
alter table public.gym_users enable row level security;
alter table public.members enable row level security;
alter table public.member_payments enable row level security;
alter table public.expenses enable row level security;
alter table public.employees enable row level security;
alter table public.salary_payments enable row level security;
alter table public.employee_attendance enable row level security;

-- gyms: read-only for the member's own gym (even when suspended, so the app can
-- show the subscription screen). No insert/update/delete policies — only SQL
-- admin workflows manage gyms.
create policy "gym_users_can_read_own_gym"
  on public.gyms for select to authenticated
  using (id = public.current_gym_id());

-- gym_users: read-only own linkage. No writes for anyone but service_role.
create policy "users_can_read_own_gym_link"
  on public.gym_users for select to authenticated
  using (user_id = auth.uid());

-- Business tables: four separate policies each, all gated on the caller's gym
-- and the gym being active. with check makes gym_id immutable client-side.
create policy "members_select_own_gym"
  on public.members for select to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "members_insert_own_gym"
  on public.members for insert to authenticated
  with check (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "members_update_own_gym"
  on public.members for update to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active())
  with check (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "members_delete_own_gym"
  on public.members for delete to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active());

create policy "member_payments_select_own_gym"
  on public.member_payments for select to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "member_payments_insert_own_gym"
  on public.member_payments for insert to authenticated
  with check (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "member_payments_update_own_gym"
  on public.member_payments for update to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active())
  with check (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "member_payments_delete_own_gym"
  on public.member_payments for delete to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active());

create policy "expenses_select_own_gym"
  on public.expenses for select to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "expenses_insert_own_gym"
  on public.expenses for insert to authenticated
  with check (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "expenses_update_own_gym"
  on public.expenses for update to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active())
  with check (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "expenses_delete_own_gym"
  on public.expenses for delete to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active());

create policy "employees_select_own_gym"
  on public.employees for select to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "employees_insert_own_gym"
  on public.employees for insert to authenticated
  with check (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "employees_update_own_gym"
  on public.employees for update to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active())
  with check (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "employees_delete_own_gym"
  on public.employees for delete to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active());

create policy "salary_payments_select_own_gym"
  on public.salary_payments for select to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "salary_payments_insert_own_gym"
  on public.salary_payments for insert to authenticated
  with check (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "salary_payments_update_own_gym"
  on public.salary_payments for update to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active())
  with check (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "salary_payments_delete_own_gym"
  on public.salary_payments for delete to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active());

create policy "employee_attendance_select_own_gym"
  on public.employee_attendance for select to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "employee_attendance_insert_own_gym"
  on public.employee_attendance for insert to authenticated
  with check (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "employee_attendance_update_own_gym"
  on public.employee_attendance for update to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active())
  with check (gym_id = public.current_gym_id() and public.is_gym_active());
create policy "employee_attendance_delete_own_gym"
  on public.employee_attendance for delete to authenticated
  using (gym_id = public.current_gym_id() and public.is_gym_active());

-- -----------------------------------------------------------------------------
-- Storage: private "photos" bucket, path layout {gym_id}/members|employees/{uuid}.jpg
-- -----------------------------------------------------------------------------

create policy "photos_select_own_gym"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = public.current_gym_id()::text
    and (storage.foldername(name))[2] in ('members', 'employees')
  );
create policy "photos_insert_own_gym"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = public.current_gym_id()::text
    and (storage.foldername(name))[2] in ('members', 'employees')
    and public.is_gym_active()
  );
create policy "photos_update_own_gym"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = public.current_gym_id()::text
    and (storage.foldername(name))[2] in ('members', 'employees')
  )
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = public.current_gym_id()::text
    and (storage.foldername(name))[2] in ('members', 'employees')
  );
create policy "photos_delete_own_gym"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = public.current_gym_id()::text
    and (storage.foldername(name))[2] in ('members', 'employees')
  );

revoke all on storage.objects from anon;
