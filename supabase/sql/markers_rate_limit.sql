-- Rate-limit marker creation for anonymous (no-auth) users.
-- This assumes your app uses a stable per-browser UUID stored in localStorage
-- and sent as `user_id` (as in `MapComponent.jsx`).
--
-- Apply in Supabase SQL Editor.

-- 1) Create an RPC that enforces a cooldown per user_id and inserts the row.
--    SECURITY DEFINER makes the function run with the privileges of its owner (typically `postgres` in Supabase),
--    which can bypass RLS on `markers` if RLS is enabled.
create or replace function public.create_marker_rate_limited(
  _emotion text,
  _position double precision[],
  _timestamp timestamptz,
  _user_id uuid,
  _user_timestamp timestamptz
) returns public.markers
language plpgsql
security definer
set search_path = public
as $$
declare
  last_created_at timestamptz;
  cooldown interval := interval '2 minutes';
  burst_allowance int := 2;
  user_count int := 0;
  inserted public.markers;
begin
  -- Count total candles for this browser/user id.
  select count(*)::int
    into user_count
  from public.markers m
  where m.user_id = _user_id;

  -- Only enforce cooldown AFTER the first N candles.
  if user_count >= burst_allowance then
    select m.created_at
      into last_created_at
    from public.markers m
    where m.user_id = _user_id
    order by m.created_at desc
    limit 1;

    if last_created_at is not null and (now() - last_created_at) < cooldown then
      raise exception 'Rate limit: please wait % seconds before placing another candle.',
        ceil(extract(epoch from (cooldown - (now() - last_created_at))))
        using errcode = 'P0001';
    end if;
  end if;

  insert into public.markers (position, emotion, timestamp, user_timestamp, user_id)
  values (_position, _emotion, _timestamp, _user_timestamp, _user_id)
  returning * into inserted;

  return inserted;
end;
$$;

-- Allow anon clients to call the RPC
grant execute on function public.create_marker_rate_limited(text, double precision[], timestamptz, uuid, timestamptz) to anon;
grant execute on function public.create_marker_rate_limited(text, double precision[], timestamptz, uuid, timestamptz) to authenticated;

-- 2) Recommended (optional but strongly suggested): enable RLS and block direct inserts.
--    NOTE: enabling RLS without a SELECT policy will break reads from the client.
alter table public.markers enable row level security;

-- Allow everyone (anon) to read markers (public map)
drop policy if exists "markers_select_all" on public.markers;
create policy "markers_select_all"
on public.markers
for select
to anon, authenticated
using (true);

-- Intentionally DO NOT create an INSERT policy.
-- With RLS enabled, direct inserts from the client will be rejected.
-- Inserts must go through `create_marker_rate_limited()`.


