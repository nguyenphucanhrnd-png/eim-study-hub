-- EIM Study Hub — accounts & sync.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run. Safe to re-run.
-- One row per user holding their synced study progress (JSON documents written by the app).

create table if not exists public.user_progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  progress   jsonb not null default '{}'::jsonb,
  exams      jsonb not null default '{}'::jsonb,
  cases      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- The server sets updated_at on every write; the app uses it to detect changes made on other devices.
create or replace function public.touch_user_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists user_progress_touch on public.user_progress;
create trigger user_progress_touch
  before insert or update on public.user_progress
  for each row execute function public.touch_user_progress();

-- Keep each user's document small (protects the free-tier database).
alter table public.user_progress drop constraint if exists user_progress_size;
alter table public.user_progress
  add constraint user_progress_size
  check (pg_column_size(progress) + pg_column_size(exams) + pg_column_size(cases) < 2000000);

-- Row-level security: a signed-in user can only see and change their own row.
alter table public.user_progress enable row level security;

drop policy if exists "Read own progress" on public.user_progress;
create policy "Read own progress" on public.user_progress
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Insert own progress" on public.user_progress;
create policy "Insert own progress" on public.user_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Update own progress" on public.user_progress;
create policy "Update own progress" on public.user_progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Delete own progress" on public.user_progress;
create policy "Delete own progress" on public.user_progress
  for delete to authenticated using ((select auth.uid()) = user_id);
