-- Rude GPS driver reports. Paste this whole file into Supabase → SQL Editor → Run.
-- Safe to run again.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('police', 'crash', 'hazard', 'traffic', 'construction', 'closure')),
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  heading real,
  device text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  confirms int not null default 0,
  denies int not null default 0
);
create index if not exists reports_geo on public.reports (lat, lon);
create index if not exists reports_exp on public.reports (expires_at);

create table if not exists public.report_votes (
  report_id uuid references public.reports on delete cascade,
  device text not null,
  primary key (report_id, device)
);

alter table public.reports enable row level security;
alter table public.report_votes enable row level security;

-- Anyone can read active reports, but never the device column.
drop policy if exists "read active reports" on public.reports;
create policy "read active reports" on public.reports for select to anon, authenticated using (expires_at > now());
revoke all on public.reports from anon, authenticated;
grant select (id, kind, lat, lon, heading, created_at, expires_at, confirms, denies) on public.reports to anon, authenticated;
revoke all on public.report_votes from anon, authenticated;

-- New report. Merges with a matching active report nearby instead of duplicating.
create or replace function public.add_report(p_kind text, p_lat float8, p_lon float8, p_heading real, p_device text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  ttl interval;
  existing uuid;
  new_id uuid;
begin
  if p_device is null or length(p_device) < 8 or length(p_device) > 64 then raise exception 'bad device'; end if;
  if exists (select 1 from reports where device = p_device and created_at > now() - interval '20 seconds') then
    raise exception 'slow down';
  end if;
  ttl := case p_kind
    when 'police' then interval '45 minutes'
    when 'crash' then interval '90 minutes'
    when 'hazard' then interval '90 minutes'
    when 'traffic' then interval '40 minutes'
    when 'construction' then interval '12 hours'
    when 'closure' then interval '6 hours'
  end;
  if ttl is null then raise exception 'bad kind'; end if;

  select id into existing from reports
   where kind = p_kind and expires_at > now()
     and abs(lat - p_lat) < 0.0015
     and abs(lon - p_lon) < 0.0015 / greatest(cos(radians(p_lat)), 0.2)
   limit 1;
  if existing is not null then
    update reports set confirms = confirms + 1, expires_at = greatest(expires_at, now() + ttl) where id = existing;
    return existing;
  end if;

  insert into reports (kind, lat, lon, heading, device, expires_at)
  values (p_kind, p_lat, p_lon, p_heading, p_device, now() + ttl)
  returning id into new_id;

  delete from reports where expires_at < now() - interval '1 day';
  return new_id;
end $$;

-- "Still there?" votes. One per device per report. Enough "gone" votes clears it.
create or replace function public.vote_report(p_id uuid, p_up boolean, p_device text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_device is null or length(p_device) < 8 or length(p_device) > 64 then raise exception 'bad device'; end if;
  insert into report_votes (report_id, device) values (p_id, p_device) on conflict do nothing;
  if not found then return; end if;
  if p_up then
    update reports set confirms = confirms + 1, expires_at = greatest(expires_at, now() + interval '30 minutes') where id = p_id;
  else
    update reports set denies = denies + 1,
      expires_at = case when denies + 1 >= confirms + 2 then now() else expires_at end
    where id = p_id;
  end if;
end $$;

revoke all on function public.add_report(text, float8, float8, real, text) from public;
revoke all on function public.vote_report(uuid, boolean, text) from public;
grant execute on function public.add_report(text, float8, float8, real, text) to anon, authenticated;
grant execute on function public.vote_report(uuid, boolean, text) to anon, authenticated;
