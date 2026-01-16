-- Rate-limit marker creation for anonymous (no-auth) users.
-- This assumes your app uses a stable per-browser UUID stored in localStorage
-- and sent as `user_id` (as in `MapComponent.jsx`).
--
-- Apply in Supabase SQL Editor.

-- Config table (so you can change cooldown without editing the function).
-- You can update it any time via:
--   update public.app_config set value = '120' where key = 'marker_cooldown_seconds';
create table if not exists public.app_config (
  key text primary key,
  value text not null
);

insert into public.app_config(key, value)
values ('marker_cooldown_seconds', '20')
on conflict (key) do nothing;

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
  cooldown_seconds int := 120;
  cooldown interval;
  inserted public.markers;
begin
  -- Pull cooldown from config (clamped for safety).
  select value::int
    into cooldown_seconds
  from public.app_config
  where key = 'marker_cooldown_seconds';

  -- Allow short cooldowns like 20s, but clamp to avoid accidental extremes.
  cooldown_seconds := greatest(5, least(3600, coalesce(cooldown_seconds, 20)));
  cooldown := make_interval(secs => cooldown_seconds);

  -- Always enforce cooldown per browser/user id.
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

-- Allow inserts ONLY via the security-definer function.
-- Direct inserts from the client run as role `anon` and will be rejected because `current_user <> 'postgres'`.
drop policy if exists "markers_insert_via_rpc" on public.markers;
create policy "markers_insert_via_rpc"
on public.markers
for insert
to anon, authenticated
with check (current_user = 'postgres');

-- 3) Simple RPC to log rejections (client-side can call this when rate limit errors occur).
create or replace function public.log_marker_rejection(
  _user_id uuid,
  _reason text,
  _payload jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.marker_rejections (user_id, reason, payload)
  values (_user_id, _reason, _payload);
end;
$$;

grant execute on function public.log_marker_rejection(uuid, text, jsonb) to anon;
grant execute on function public.log_marker_rejection(uuid, text, jsonb) to authenticated;


