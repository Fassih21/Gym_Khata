-- =============================================================================
-- GymKhata — Suspend / resume a gym, or extend its subscription
-- Run in the SQL editor. RLS instantly blocks all data access when suspended.
-- =============================================================================

-- Suspend (blocks reads AND writes immediately):
update public.gyms
set status = 'suspended'
where name = '<GYM NAME>';

-- Resume:
-- update public.gyms set status = 'active' where name = '<GYM NAME>';

-- Extend subscription by 30 days:
-- update public.gyms
-- set subscription_ends_on = greatest(subscription_ends_on, current_date) + 30
-- where name = '<GYM NAME>';

-- Check status:
-- select name, status, subscription_ends_on from public.gyms where name = '<GYM NAME>';
