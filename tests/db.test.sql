\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages = notice;
insert into auth.users (id,email,last_sign_in_at) values
 ('00000000-0000-0000-0000-0000000000a1','owner1@x.pk', now()),
 ('00000000-0000-0000-0000-0000000000a2','owner2@x.pk', null),
 ('00000000-0000-0000-0000-0000000000a3','shared@x.pk', null),
 ('00000000-0000-0000-0000-0000000000ad','admin@x.pk', now());
insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-0000000000ad');

-- helper: expect an insufficient_privilege (or RLS) failure
create or replace function pg_temp.denied(sql text) returns text language plpgsql as $$
begin execute sql; return 'ALLOWED'; exception when insufficient_privilege then return 'denied'; when others then return 'other:'||sqlstate; end $$;
grant execute on function pg_temp.denied(text) to public;

-- 1) client roles: zero access to new tables + functions
do $$ declare r text; t text; begin
 foreach r in array array['anon','authenticated'] loop
  execute format('set local role %I', r);
  foreach t in array array['platform_admins','admin_audit_log','gym_billing_notes'] loop
    if pg_temp.denied(format('select 1 from public.%I', t)) <> 'denied' then raise exception 'FAIL % can SELECT %', r, t; end if;
    if pg_temp.denied(format('delete from public.%I', t)) <> 'denied' then raise exception 'FAIL % can DELETE %', r, t; end if;
  end loop;
  if pg_temp.denied('insert into public.platform_admins values (gen_random_uuid())') <> 'denied' then raise exception 'FAIL % can self-promote', r; end if;
  if pg_temp.denied('select * from public.admin_list_gyms()') <> 'denied' then raise exception 'FAIL % can exec admin_list_gyms', r; end if;
  if pg_temp.denied($f$select public.admin_delete_gym_data(gen_random_uuid(), gen_random_uuid())$f$) <> 'denied' then raise exception 'FAIL % can exec delete', r; end if;
  if pg_temp.denied($f$select public.admin_audit(gen_random_uuid(),'x',null,'{}')$f$) <> 'denied' then raise exception 'FAIL % can forge audit', r; end if;
  reset role;
 end loop;
 raise notice 'PASS 1: anon/authenticated -> no read/write on platform_admins, audit_log, billing_notes; cannot execute admin_* functions';
end $$;

-- 2) service_role: audit insert-only
set role service_role;
select public.admin_audit('00000000-0000-0000-0000-0000000000ad','probe',null,'{"k":1}');
do $$ begin
 if pg_temp.denied('update public.admin_audit_log set action=''x''') = 'ALLOWED' then raise exception 'FAIL audit update'; end if;
 if pg_temp.denied('delete from public.admin_audit_log') = 'ALLOWED' then raise exception 'FAIL audit delete'; end if;
 if pg_temp.denied('truncate public.admin_audit_log') = 'ALLOWED' then raise exception 'FAIL audit truncate'; end if;
 raise notice 'PASS 2: admin_audit_log insert-only even for service_role (update/delete/truncate blocked)';
end $$;
reset role;
-- trigger layer also blocks the table owner
do $$ begin begin update public.admin_audit_log set action='x'; raise exception 'FAIL owner update'; exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
 raise notice 'PASS 2b: trigger blocks update even for table owner'; end $$;

-- 3) functions as service_role
set role service_role;
do $$ declare g1 uuid; g2 uuid; ad uuid := '00000000-0000-0000-0000-0000000000ad'; uids uuid[]; n int; begin
 g1 := public.admin_create_gym(ad,'  Iron Gym ','00000000-0000-0000-0000-0000000000a1','owner1@x.pk','pro', current_date+30);
 g2 := public.admin_create_gym(ad,'Other Gym','00000000-0000-0000-0000-0000000000a2','owner2@x.pk','basic', current_date+3);
 insert into public.gym_users values ('00000000-0000-0000-0000-0000000000a3', g1, 'staff'), ('00000000-0000-0000-0000-0000000000a3', g2, 'staff'),
   ('00000000-0000-0000-0000-0000000000ad', g1, 'staff');   -- a3 shared with g2, ad is platform admin
 insert into public.members (gym_id,name,phone) values (g1,'M One','0300-1234567'),(g1,'M Two','0300-1234568'),(g2,'M Three','0300-1234569');
 update public.members set deleted_at=now() where name='M Two';
 insert into public.membership_plans (gym_id,name,duration_months,price) values (g1,'Monthly',1,3000);
 insert into public.members (gym_id,name,phone,plan_id) select g1,'M Four','0300-1234560',id from public.membership_plans where gym_id=g1;

 select members_count into n from public.admin_list_gyms() where id=g1;
 if n <> 2 then raise exception 'FAIL members_count % (expected 2: non-deleted only)', n; end if;
 if (select name from public.gyms where id=g1) <> 'Iron Gym' then raise exception 'FAIL name not trimmed'; end if;
 raise notice 'PASS 3a: create_gym (atomic gyms+gym_users+audit), list returns counts only (members_count=%)', n;

 -- bad plan (empty) -> check violation -> no orphan gym
 begin perform public.admin_create_gym(ad,'Orphan?','00000000-0000-0000-0000-0000000000a1','x','   ',current_date+1); raise exception 'FAIL empty plan accepted'; exception when check_violation then null; end;
 if exists (select 1 from public.gyms where name='Orphan?') then raise exception 'FAIL orphan gym left behind'; end if;
 raise notice 'PASS 3b: failed create leaves no orphan gym row';

 -- delete guard + behaviour
 begin perform public.admin_delete_gym_data(ad, g1); raise exception 'FAIL deleted active gym'; exception when sqlstate 'P0001' then null; end;
 perform public.admin_set_gym_status(ad, g1, 'suspended');
 perform public.admin_extend_subscription(ad, g1, current_date+60, 5000, 'Easypaisa', 'Oct renewal');
 if (select count(*) from public.gym_billing_notes where gym_id=g1) <> 1 then raise exception 'FAIL billing note'; end if;
 uids := public.admin_delete_gym_data(ad, g1);
 if exists (select 1 from public.gyms where id=g1) or exists (select 1 from public.members where gym_id=g1)
    or exists (select 1 from public.membership_plans where gym_id=g1) or exists (select 1 from public.gym_users where gym_id=g1)
 then raise exception 'FAIL rows left after delete'; end if;
 if uids <> array['00000000-0000-0000-0000-0000000000a1']::uuid[] then raise exception 'FAIL auth-user list: %', uids; end if;
 if (select count(*) from public.members where gym_id=g2) <> 1 then raise exception 'FAIL other gym touched'; end if;
 if (select count(*) from public.gym_billing_notes where gym_id=g1) <> 1 then raise exception 'FAIL billing note lost'; end if;
 raise notice 'PASS 3c: delete requires suspended; FK-order delete OK; returns ONLY sole-gym users (shared user + platform admin excluded); other gym intact; billing note kept';
 select count(*) into n from public.admin_audit_log where gym_id=g1 and action in ('create_gym','suspend_gym','extend_subscription','delete_gym_rows');
 if n <> 4 then raise exception 'FAIL audit rows %', n; end if;
 raise notice 'PASS 3d: every action audited (4/4), audit rows survive gym delete';
end $$;
reset role;

-- 4) customer isolation unchanged
do $$ declare g2 uuid; n int; begin
 select id into g2 from public.gyms where name='Other Gym';
 set local role authenticated; perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a2', true);
 select count(*) into n from public.members; if n <> 1 then raise exception 'FAIL owner2 sees % members', n; end if;
 perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a1', true);
 select count(*) into n from public.members; if n <> 0 then raise exception 'FAIL deleted-gym user sees % members', n; end if;
 if pg_temp.denied('update public.gyms set plan=''pro'', status=''active''') <> 'denied' and (select count(*) from public.gyms where plan='pro' and name='Other Gym')>0 then raise exception 'FAIL owner can edit own gym'; end if;
 raise notice 'PASS 4: customer RLS unchanged (owner sees only own gym rows; cannot edit gyms/plan)';
end $$;
