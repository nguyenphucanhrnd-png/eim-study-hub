-- EIM Study Hub — usage analytics (which features people use, how long they actively spend, where they drop off).
-- Run after schema.sql: SQL Editor → New query → paste → Run. Safe to re-run.
--
-- Design:
--   * Everything lives in the `analytics` schema, which is NOT exposed through the Supabase API. Browsers cannot read
--     or write these tables directly; they can only call public.track_events(), which validates and caps each batch.
--   * Both signed-in and anonymous visitors are tracked (anonymous_id = random UUID kept in localStorage), because most
--     visitors never create an account. user_id is always taken from the JWT (auth.uid()), never from the client.
--   * Durations are ACTIVE time measured by the client (tab visible and not idle), not wall-clock time.
--   * Raw events are kept 90 days; daily per-feature rollups are kept forever (protects the free-tier database).
--
-- Event contract (what the app sends):
--   screen_view    on entering a route                         feature, route, entity_id (e.g. 'c3', 'incoterms')
--   screen_time    on leaving a route or hiding the tab        + duration_ms = active time since the last screen_time
--   task_start     a unit of work begins                       feature, entity_id (e.g. 'exam-03'), task_id (new UUID)
--   task_complete  the same unit is finished                   same task_id, duration_ms = active time, props {score…}
--   task_abandon   the user explicitly quits it                same task_id
--   action         a notable interaction                       props {name: 'filter_change', …}
--   error          a client-side error                         props {message: …}

create schema if not exists analytics;
revoke all on schema analytics from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------------------------------

-- Feature catalogue: the allowed values of events.feature, with labels for the dashboard.
create table if not exists analytics.features (
  key        text primary key check (key ~ '^[a-z][a-z0-9_]{1,31}$'),
  label      text not null,
  route      text,
  category   text not null default 'study',
  sort_order int  not null default 0
);

insert into analytics.features (key, label, route, category, sort_order) values
  ('dashboard',  'Dashboard',              '/',           'overview',  10),
  ('learn',      'Lý thuyết C1–C8',        '/learn',      'study',     20),
  ('practice',   'Luyện MCQ',              '/practice',   'practice',  30),
  ('exams',      'Đề thi thử',             '/exams',      'practice',  40),
  ('cases',      'Case study',             '/cases',      'practice',  50),
  ('review',     'Ôn câu sai & đánh dấu',  '/review',     'practice',  60),
  ('flashcards', 'Flashcards',             '/flashcards', 'study',     70),
  ('glossary',   'Thuật ngữ EN–VI',        '/glossary',   'study',     80),
  ('tools',      'Công cụ tương tác',      '/tools',      'tools',     90),
  ('diagrams',   'Sơ đồ tương tác',        '/diagrams',   'tools',    100),
  ('journey',    'Hành trình giao dịch',   '/journey',    'tools',    110),
  ('account',    'Tài khoản',              '/account',    'system',   120),
  ('unknown',    'Không xác định',         null,          'system',   999)
on conflict (key) do update
  set label = excluded.label, route = excluded.route, category = excluded.category, sort_order = excluded.sort_order;

-- One row per browser session (a new session starts after 30 minutes of inactivity — decided by the client).
create table if not exists analytics.sessions (
  session_id   uuid primary key,
  anonymous_id uuid not null,
  user_id      uuid references auth.users (id) on delete set null,
  started_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  event_count  int not null default 0,
  device_type  text check (device_type in ('mobile', 'tablet', 'desktop')),
  viewport_w   smallint,
  viewport_h   smallint,
  language     text check (char_length(language) <= 20),
  app_version  text check (char_length(app_version) <= 40),
  referrer     text check (char_length(referrer) <= 300)
);

create index if not exists sessions_anonymous_idx on analytics.sessions (anonymous_id);
create index if not exists sessions_user_idx on analytics.sessions (user_id) where user_id is not null;
create index if not exists sessions_last_seen_idx on analytics.sessions (last_seen_at);

-- Raw event log.
create table if not exists analytics.events (
  id           bigint generated always as identity primary key,
  session_id   uuid not null references analytics.sessions (session_id) on delete cascade,
  anonymous_id uuid not null,
  user_id      uuid references auth.users (id) on delete set null,
  event_name   text not null check (event_name in
                 ('screen_view', 'screen_time', 'task_start', 'task_complete', 'task_abandon', 'action', 'error')),
  feature      text not null references analytics.features (key) on update cascade,
  route        text check (char_length(route) <= 200),
  entity_id    text check (char_length(entity_id) <= 100),
  task_id      uuid,
  duration_ms  integer check (duration_ms between 0 and 14400000),
  properties   jsonb not null default '{}'::jsonb
                 check (jsonb_typeof(properties) = 'object' and pg_column_size(properties) < 2048),
  occurred_at  timestamptz not null,
  received_at  timestamptz not null default now()
);

create index if not exists events_session_received_idx on analytics.events (session_id, received_at);
create index if not exists events_occurred_idx on analytics.events (occurred_at);
create index if not exists events_task_idx on analytics.events (task_id) where task_id is not null;
create index if not exists events_user_idx on analytics.events (user_id) where user_id is not null;

-- Daily per-feature rollup (kept after raw events are purged). Days are in Vietnam time.
create table if not exists analytics.daily_feature_stats (
  day                 date not null,
  feature             text not null references analytics.features (key) on update cascade,
  visitors            int not null default 0,
  signed_in_users     int not null default 0,
  sessions            int not null default 0,
  screen_views        int not null default 0,
  active_seconds      bigint not null default 0,
  tasks_started       int not null default 0,
  tasks_completed     int not null default 0,
  median_task_seconds numeric,
  errors              int not null default 0,
  updated_at          timestamptz not null default now(),
  primary key (day, feature)
);

-- Defence in depth: RLS on with no policies = no access for API roles even if the schema were exposed by mistake.
alter table analytics.features            enable row level security;
alter table analytics.sessions            enable row level security;
alter table analytics.events              enable row level security;
alter table analytics.daily_feature_stats enable row level security;

-- ---------------------------------------------------------------------------------------------------------------------
-- Safe casts (bad client input becomes NULL instead of failing the whole batch)
-- ---------------------------------------------------------------------------------------------------------------------

create or replace function analytics.try_uuid(p text)
returns uuid
language sql immutable
set search_path = ''
as $$
  select case when p ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then p::uuid end;
$$;

create or replace function analytics.try_bigint(p text)
returns bigint
language sql immutable
set search_path = ''
as $$
  select case when p ~ '^[0-9]{1,12}$' then p::bigint end;
$$;

create or replace function analytics.try_timestamptz(p text)
returns timestamptz
language plpgsql stable
set search_path = ''
as $$
begin
  return p::timestamptz;
exception when others then
  return null;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------------
-- Ingestion endpoint: POST /rest/v1/rpc/track_events  { "p_session": {...}, "p_events": [...] }
-- Returns the number of events stored (0 when the batch was dropped by the flood guard).
-- ---------------------------------------------------------------------------------------------------------------------

create or replace function public.track_events(p_session jsonb, p_events jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id    uuid := auth.uid();
  v_session_id uuid := analytics.try_uuid(p_session ->> 'session_id');
  v_anon_id    uuid := analytics.try_uuid(p_session ->> 'anonymous_id');
  v_owner      uuid;
  v_batch      int;
  v_recent     int;
  v_inserted   int;
begin
  if v_session_id is null or v_anon_id is null then
    raise exception 'p_session.session_id and p_session.anonymous_id must be UUIDs' using errcode = '22023';
  end if;
  if p_events is null or jsonb_typeof(p_events) <> 'array' then
    raise exception 'p_events must be a JSON array' using errcode = '22023';
  end if;

  v_batch := jsonb_array_length(p_events);
  if v_batch = 0 then
    return 0;
  end if;
  if v_batch > 50 then
    raise exception 'At most 50 events per call' using errcode = '22023';
  end if;

  insert into analytics.sessions as s
    (session_id, anonymous_id, user_id, device_type, viewport_w, viewport_h, language, app_version, referrer)
  values (
    v_session_id, v_anon_id, v_user_id,
    case when p_session ->> 'device_type' in ('mobile', 'tablet', 'desktop') then p_session ->> 'device_type' end,
    case when analytics.try_bigint(p_session ->> 'viewport_w') between 1 and 32767
         then analytics.try_bigint(p_session ->> 'viewport_w')::smallint end,
    case when analytics.try_bigint(p_session ->> 'viewport_h') between 1 and 32767
         then analytics.try_bigint(p_session ->> 'viewport_h')::smallint end,
    left(p_session ->> 'language', 20),
    left(p_session ->> 'app_version', 40),
    left(p_session ->> 'referrer', 300)
  )
  on conflict (session_id) do update
    set last_seen_at = now(),
        user_id      = coalesce(excluded.user_id, s.user_id)
    where s.anonymous_id = excluded.anonymous_id;

  -- A session id can only be extended by the visitor who created it.
  select anonymous_id into v_owner from analytics.sessions where session_id = v_session_id;
  if v_owner is distinct from v_anon_id then
    raise exception 'Session belongs to another visitor' using errcode = '42501';
  end if;

  -- Flood guard: at most 300 events per session per minute.
  select count(*) into v_recent
  from analytics.events
  where session_id = v_session_id and received_at > now() - interval '1 minute';
  if v_recent + v_batch > 300 then
    return 0;
  end if;

  insert into analytics.events
    (session_id, anonymous_id, user_id, event_name, feature, route, entity_id, task_id, duration_ms, properties, occurred_at)
  select
    v_session_id,
    v_anon_id,
    v_user_id,
    e ->> 'name',
    coalesce(f.key, 'unknown'),
    left(e ->> 'route', 200),
    left(e ->> 'entity_id', 100),
    analytics.try_uuid(e ->> 'task_id'),
    case when c.ms between 0 and 14400000 then c.ms::int end,
    case when jsonb_typeof(e -> 'props') = 'object' and pg_column_size(e -> 'props') < 2048
         then e -> 'props' else '{}'::jsonb end,
    -- Accept client time (events may be queued offline), but clamp clocks that are clearly wrong.
    case when c.ts between now() - interval '3 days' and now() + interval '5 minutes' then c.ts else now() end
  from jsonb_array_elements(p_events) with ordinality as a (e, idx)
  cross join lateral (
    select analytics.try_bigint(e ->> 'duration_ms') as ms,
           analytics.try_timestamptz(e ->> 'occurred_at') as ts
  ) as c
  left join analytics.features f on f.key = e ->> 'feature'
  where e ->> 'name' in ('screen_view', 'screen_time', 'task_start', 'task_complete', 'task_abandon', 'action', 'error')
  order by a.idx;

  get diagnostics v_inserted = row_count;

  update analytics.sessions
  set event_count = event_count + v_inserted, last_seen_at = now()
  where session_id = v_session_id;

  return v_inserted;
end;
$$;

revoke all on function public.track_events(jsonb, jsonb) from public;
grant execute on function public.track_events(jsonb, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------------
-- Base view: events joined with their session. person_id counts a signed-in user once across devices.
-- ---------------------------------------------------------------------------------------------------------------------

create or replace view analytics.v_events with (security_invoker = true) as
select
  e.id,
  e.session_id,
  e.event_name,
  e.feature,
  f.label                                          as feature_label,
  f.category,
  e.route,
  e.entity_id,
  e.task_id,
  e.duration_ms,
  e.properties,
  e.occurred_at,
  (e.occurred_at at time zone 'Asia/Ho_Chi_Minh')::date as day,
  coalesce(e.user_id, s.user_id)                   as user_id,
  coalesce(e.user_id, s.user_id, s.anonymous_id)   as person_id,
  s.device_type
from analytics.events e
join analytics.sessions s on s.session_id = e.session_id
join analytics.features f on f.key = e.feature;

-- ---------------------------------------------------------------------------------------------------------------------
-- Rollup & retention jobs
-- ---------------------------------------------------------------------------------------------------------------------

create or replace function analytics.rollup_daily(p_day date)
returns void
language sql
set search_path = ''
as $$
  insert into analytics.daily_feature_stats as d
    (day, feature, visitors, signed_in_users, sessions, screen_views, active_seconds,
     tasks_started, tasks_completed, median_task_seconds, errors, updated_at)
  select
    p_day,
    e.feature,
    count(distinct e.person_id),
    count(distinct e.user_id),
    count(distinct e.session_id),
    count(*) filter (where e.event_name = 'screen_view'),
    coalesce(sum(e.duration_ms) filter (where e.event_name = 'screen_time'), 0) / 1000,
    count(distinct e.task_id) filter (where e.event_name = 'task_start'),
    count(distinct e.task_id) filter (where e.event_name = 'task_complete'),
    round((percentile_cont(0.5) within group (order by e.duration_ms)
           filter (where e.event_name = 'task_complete') / 1000)::numeric, 1),
    count(*) filter (where e.event_name = 'error'),
    now()
  from analytics.v_events e
  where e.occurred_at >= (p_day::timestamp at time zone 'Asia/Ho_Chi_Minh')
    and e.occurred_at <  ((p_day + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh')
  group by e.feature
  on conflict (day, feature) do update set
    visitors            = excluded.visitors,
    signed_in_users     = excluded.signed_in_users,
    sessions            = excluded.sessions,
    screen_views        = excluded.screen_views,
    active_seconds      = excluded.active_seconds,
    tasks_started       = excluded.tasks_started,
    tasks_completed     = excluded.tasks_completed,
    median_task_seconds = excluded.median_task_seconds,
    errors              = excluded.errors,
    updated_at          = excluded.updated_at;
$$;

-- Recompute today and the last few days (late events from offline queues land up to 3 days late).
create or replace function analytics.rollup_recent(p_days int default 3)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_day   date;
begin
  for v_day in
    select generate_series((v_today - p_days)::timestamp, v_today::timestamp, interval '1 day')::date
  loop
    perform analytics.rollup_daily(v_day);
  end loop;
end;
$$;

-- Delete raw sessions/events older than p_days (events cascade). Rollups are kept.
create or replace function analytics.purge_old(p_days int default 90)
returns integer
language sql
set search_path = ''
as $$
  with deleted as (
    delete from analytics.sessions
    where last_seen_at < now() - make_interval(days => p_days)
    returning 1
  )
  select count(*)::int from deleted;
$$;

-- Scheduling (pg_cron is available on every Supabase plan). Times are UTC: 17:30 UTC = 00:30 Vietnam time.
create extension if not exists pg_cron;
select cron.schedule('analytics-rollup-hourly', '5 * * * *',  $$select analytics.rollup_recent(3);$$);
select cron.schedule('analytics-purge-daily',   '30 17 * * *', $$select analytics.purge_old(90);$$);

-- ---------------------------------------------------------------------------------------------------------------------
-- Dashboard views
-- ---------------------------------------------------------------------------------------------------------------------

-- Trend per day × feature (full history, from the rollup).
create or replace view analytics.v_feature_daily with (security_invoker = true) as
select
  d.day,
  d.feature,
  f.label                                                         as feature_label,
  f.category,
  d.visitors,
  d.signed_in_users,
  d.sessions,
  d.screen_views,
  round(d.active_seconds / 60.0, 1)                               as active_minutes,
  round(d.active_seconds / 60.0 / nullif(d.visitors, 0), 1)       as avg_minutes_per_visitor,
  d.tasks_started,
  d.tasks_completed,
  round(100.0 * d.tasks_completed / nullif(d.tasks_started, 0), 1) as completion_rate_pct,
  round(d.median_task_seconds / 60.0, 1)                          as median_task_minutes,
  d.errors
from analytics.daily_feature_stats d
join analytics.features f on f.key = d.feature;

-- Where the time goes (last 30 days): active time per feature, per session.
create or replace view analytics.v_feature_time_30d with (security_invoker = true) as
with per_session as (
  select feature, feature_label, session_id, person_id, sum(duration_ms) as active_ms
  from analytics.v_events
  where event_name = 'screen_time' and occurred_at >= now() - interval '30 days'
  group by feature, feature_label, session_id, person_id
)
select
  feature,
  feature_label,
  count(distinct person_id)                                                        as visitors,
  count(*)                                                                         as sessions,
  round(sum(active_ms) / 3600000.0, 1)                                             as total_active_hours,
  round(100.0 * sum(active_ms) / nullif(sum(sum(active_ms)) over (), 0), 1)        as share_of_time_pct,
  round(sum(active_ms) / 60000.0 / nullif(count(distinct person_id), 0), 1)        as avg_min_per_visitor,
  round((percentile_cont(0.5) within group (order by active_ms) / 60000)::numeric, 1) as p50_min_per_session,
  round((percentile_cont(0.9) within group (order by active_ms) / 60000)::numeric, 1) as p90_min_per_session
from per_session
group by feature, feature_label;

-- Which specific item (chapter, exam, case, diagram, tool…) holds people longest (last 30 days).
create or replace view analytics.v_entity_time_30d with (security_invoker = true) as
with per_visit as (
  select feature, feature_label, entity_id, session_id, person_id, sum(duration_ms) as active_ms
  from analytics.v_events
  where event_name = 'screen_time' and entity_id is not null and occurred_at >= now() - interval '30 days'
  group by feature, feature_label, entity_id, session_id, person_id
)
select
  feature,
  feature_label,
  entity_id,
  count(distinct person_id)                                                        as visitors,
  count(*)                                                                         as visits,
  round(sum(active_ms) / 60000.0, 1)                                               as total_active_minutes,
  round((percentile_cont(0.5) within group (order by active_ms) / 60000)::numeric, 1) as p50_min_per_visit,
  round((percentile_cont(0.9) within group (order by active_ms) / 60000)::numeric, 1) as p90_min_per_visit
from per_visit
group by feature, feature_label, entity_id;

-- Task funnel (last 30 days): started → completed, plus how long completion takes.
-- A task counts as dropped when it was abandoned explicitly or is still unfinished 24 h after it started.
create or replace view analytics.v_task_funnel_30d with (security_invoker = true) as
with tasks as (
  select
    task_id,
    max(feature)                                                   as feature,
    max(feature_label)                                             as feature_label,
    max(entity_id)                                                 as entity_id,
    min(occurred_at) filter (where event_name = 'task_start')      as started_at,
    min(occurred_at) filter (where event_name = 'task_complete')   as completed_at,
    bool_or(event_name = 'task_abandon')                           as abandoned,
    max(duration_ms) filter (where event_name = 'task_complete')   as active_ms
  from analytics.v_events
  where task_id is not null and occurred_at >= now() - interval '30 days'
  group by task_id
)
select
  feature,
  feature_label,
  entity_id,
  count(started_at)                                                                as started,
  count(completed_at)                                                              as completed,
  count(*) filter (where started_at is not null and completed_at is null
                     and (abandoned or started_at < now() - interval '24 hours'))  as dropped,
  round(100.0 * count(completed_at) / nullif(count(started_at), 0), 1)             as completion_rate_pct,
  round((percentile_cont(0.5) within group (order by active_ms) / 60000)::numeric, 1) as p50_active_min,
  round((percentile_cont(0.9) within group (order by active_ms) / 60000)::numeric, 1) as p90_active_min,
  round((percentile_cont(0.5) within group (order by extract(epoch from completed_at - started_at)) / 60)::numeric, 1)
                                                                                   as p50_wall_clock_min
from tasks
group by feature, feature_label, entity_id;

-- Exit rate (last 30 days): share of sessions that ended on this feature. Ongoing sessions are excluded.
create or replace view analytics.v_exit_rate_30d with (security_invoker = true) as
with views as (
  select
    v.session_id,
    v.feature,
    v.feature_label,
    row_number() over (partition by v.session_id order by v.occurred_at desc, v.id desc) as rn_desc
  from analytics.v_events v
  join analytics.sessions s on s.session_id = v.session_id
  where v.event_name = 'screen_view'
    and v.occurred_at >= now() - interval '30 days'
    and s.last_seen_at < now() - interval '30 minutes'
)
select
  feature,
  feature_label,
  count(distinct session_id)                                                          as sessions_with_feature,
  count(*) filter (where rn_desc = 1)                                                 as exits,
  round(100.0 * count(*) filter (where rn_desc = 1) / nullif(count(distinct session_id), 0), 1) as exit_rate_pct
from views
group by feature, feature_label;

-- Navigation flow (last 30 days): from one feature to the next, or to '(exit)'. Moves inside a feature are skipped.
create or replace view analytics.v_feature_flow_30d with (security_invoker = true) as
with views as (
  select
    session_id,
    feature,
    lead(feature) over (partition by session_id order by occurred_at, id) as next_feature
  from analytics.v_events
  where event_name = 'screen_view' and occurred_at >= now() - interval '30 days'
)
select
  feature                          as from_feature,
  coalesce(next_feature, '(exit)') as to_feature,
  count(*)                         as transitions,
  count(distinct session_id)       as sessions
from views
where next_feature is distinct from feature
group by feature, coalesce(next_feature, '(exit)');

-- Bottleneck scorecard (last 30 days): one row per feature.
-- Read it together: high time + low completion + high exit/errors = friction; high time + high completion = engagement.
create or replace view analytics.v_feature_health_30d with (security_invoker = true) as
with funnel as (
  select feature, sum(started) as started, sum(completed) as completed, sum(dropped) as dropped
  from analytics.v_task_funnel_30d
  group by feature
),
errs as (
  select feature, count(*) as errors
  from analytics.v_events
  where event_name = 'error' and occurred_at >= now() - interval '30 days'
  group by feature
)
select
  f.key                                                        as feature,
  f.label                                                      as feature_label,
  f.category,
  coalesce(t.visitors, 0)                                      as visitors,
  t.share_of_time_pct,
  t.avg_min_per_visitor,
  t.p50_min_per_session,
  t.p90_min_per_session,
  coalesce(fu.started, 0)                                      as tasks_started,
  coalesce(fu.dropped, 0)                                      as tasks_dropped,
  round(100.0 * fu.completed / nullif(fu.started, 0), 1)       as completion_rate_pct,
  x.exit_rate_pct,
  coalesce(er.errors, 0)                                       as errors
from analytics.features f
left join analytics.v_feature_time_30d t on t.feature = f.key
left join funnel fu                      on fu.feature = f.key
left join analytics.v_exit_rate_30d x    on x.feature = f.key
left join errs er                        on er.feature = f.key
where f.key <> 'unknown' or t.visitors > 0;

-- ---------------------------------------------------------------------------------------------------------------------
-- Optional: read-only login for a BI tool (Power BI, Metabase, Looker Studio…). Uncomment, set a strong password, run.
-- Connect with the Session pooler host from Project Settings → Database; user name is dashboard_reader.<project-ref>.
-- ---------------------------------------------------------------------------------------------------------------------
-- create role dashboard_reader with login password 'CHANGE-ME-to-a-long-random-password';
-- grant usage on schema analytics to dashboard_reader;
-- grant select on all tables in schema analytics to dashboard_reader;
-- alter default privileges in schema analytics grant select on tables to dashboard_reader;
