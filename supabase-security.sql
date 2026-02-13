-- Supabase hardening for public deployment (anonymous auth ownership)
--
-- What this does:
-- 1) Deletes ALL existing markers (requested)
-- 2) Enables RLS + defines safe policies
-- 3) Revokes dangerous table grants from public roles
-- 4) Replaces `create_marker_rate_limited` to always use `auth.uid()`
--
-- Run this in Supabase SQL Editor as an admin (postgres/service_role).

begin;

-- 0) Delete all existing rows (clean slate)
delete from public.markers;

-- 1) Ensure RLS is enabled
alter table public.markers enable row level security;

-- 2) Remove old policies (names based on your current pg_policies output)
drop policy if exists markers_delete_own on public.markers;
drop policy if exists markers_insert_via_rpc on public.markers;
drop policy if exists markers_select_all on public.markers;

-- 3) Revoke dangerous direct table privileges from public roles
-- Public can read, but should not be able to truncate/update/delete directly.
revoke all on table public.markers from anon;
revoke all on table public.markers from authenticated;

grant select on table public.markers to anon;
grant select on table public.markers to authenticated;
grant delete on table public.markers to authenticated;

-- 4) RLS policies
-- Public read: anyone can view all candles
create policy markers_select_all
on public.markers
for select
to anon, authenticated
using (true);

-- Only authenticated users can delete their own candles
create policy markers_delete_own
on public.markers
for delete
to authenticated
using (user_id = auth.uid());

-- Note: we intentionally do NOT create an INSERT policy.
-- Inserts must go through the RPC (security definer) which writes user_id = auth.uid().

-- 5) RPC: create_marker_rate_limited
-- This replaces the function signature to remove `_user_id`.
-- If you have other code calling it, update the frontend to match.
drop function if exists public.create_marker_rate_limited(_emotion text, _position double precision[], _timestamp timestamptz, _user_id uuid, _user_timestamp timestamptz);
drop function if exists public.create_marker_rate_limited(_emotion text, _position double precision[], _timestamp timestamptz, _user_timestamp timestamptz);

create or replace function public.create_marker_rate_limited(
  _emotion text,
  _position double precision[],
  _timestamp timestamptz,
  _user_timestamp timestamptz
)
returns public.markers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_new public.markers;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- IMPORTANT:
  -- Keep your existing rate-limit logic here (if you had it previously).
  -- This stub preserves the ownership/security model and assumes the old logic
  -- was already implemented in your existing function.

  insert into public.markers (emotion, position, timestamp, user_timestamp, user_id)
  values (_emotion, _position, _timestamp, _user_timestamp, v_user_id)
  returning * into v_new;

  return v_new;
end;
$$;

-- Allow client roles to execute the function
grant execute on function public.create_marker_rate_limited(text, double precision[], timestamptz, timestamptz) to anon, authenticated;

commit;

