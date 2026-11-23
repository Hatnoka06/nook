-- UniFlow v1 schema. Run on an empty Supabase project (SQL editor or `supabase db push`).
create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- profiles (id = auth.users.id)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text, university text,
  language text not null default 'en' check (language in ('en','vi')),
  theme text not null default 'system' check (theme in ('light','dark','system')),
  time_zone text not null default 'Australia/Sydney',
  week_starts_on smallint not null default 1 check (week_starts_on in (0,1)),
  daily_study_goal_minutes integer not null default 120 check (daily_study_goal_minutes between 0 and 1440),
  widget_visibility jsonb not null default '{"greeting":true,"schedule":true,"tasks":true,"deadlines":true,"study":true}',
  background_id text not null default 'alpine' check (background_id in ('alpine','plain')),
  reduce_effects boolean not null default false,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, is_demo boolean not null default false,
  name text not null, start_date date not null, end_date date not null,
  is_current boolean not null default false, week1_start date,
  check (end_date >= start_date)
);
create table public.semester_breaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, is_demo boolean not null default false,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  name text not null, start_date date not null, end_date date not null,
  counts_as_week boolean not null default false, check (end_date >= start_date)
);
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, is_demo boolean not null default false,
  code text not null, name text not null,
  kind text not null default 'uni' check (kind in ('uni','self')),
  semester_id uuid references public.semesters(id) on delete cascade,
  lecturer text, color text not null default '#8B83C8', is_archived boolean not null default false
);
create table public.course_meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, is_demo boolean not null default false,
  course_id uuid not null references public.courses(id) on delete cascade,
  type text not null default 'lecture' check (type in ('lecture','tutorial','workshop','practical','sgta','other')),
  weekday smallint not null check (weekday between 1 and 7), -- ISO: 1=Mon .. 7=Sun
  start_time time not null, end_time time not null, location text,
  from_date date, to_date date,
  week_pattern text not null default 'every' check (week_pattern in ('every','odd','even')),
  skipped_dates date[] not null default '{}',
  check (end_time > start_time)
);
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, is_demo boolean not null default false,
  title text not null,
  type text not null default 'personal' check (type in ('class','routine','learn','meeting','work','personal','other')),
  start_at timestamptz not null, end_at timestamptz not null, all_day boolean not null default false,
  location text, description text, time_zone text not null default 'Australia/Sydney',
  repeat_rule jsonb, course_id uuid references public.courses(id) on delete set null,
  check (end_at >= start_at)
);
create table public.event_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, is_demo boolean not null default false,
  event_id uuid not null references public.events(id) on delete cascade,
  occurrence_date date not null, is_cancelled boolean not null default false,
  title text, start_at timestamptz, end_at timestamptz,
  unique (event_id, occurrence_date)
);
create table public.deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, is_demo boolean not null default false,
  title text not null, course_id uuid references public.courses(id) on delete set null,
  type text not null default 'assignment' check (type in ('assignment','quiz','exam','presentation','other')),
  due_at timestamptz not null,
  weight_percent numeric check (weight_percent between 0 and 100),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'not_started' check (status in ('not_started','in_progress','submitted')),
  progress_percent numeric check (progress_percent between 0 and 100),
  estimated_hours numeric, location text, url text, description text, completed_at timestamptz
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, is_demo boolean not null default false,
  title text not null, notes text, due_date date, due_time time,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  category text not null default 'study' check (category in ('study','work','personal','admin')),
  course_id uuid references public.courses(id) on delete set null,
  deadline_id uuid references public.deadlines(id) on delete set null,
  estimated_minutes integer, is_top boolean not null default false,
  status text not null default 'todo' check (status in ('todo','done')), completed_at timestamptz
);
create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, is_demo boolean not null default false,
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null, is_done boolean not null default false, position integer not null default 0
);
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, is_demo boolean not null default false,
  course_id uuid references public.courses(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  goal text, mode text not null default 'pomodoro' check (mode in ('pomodoro','deep_work','custom','stopwatch','manual')),
  started_at timestamptz not null, ended_at timestamptz not null,
  focus_seconds integer not null check (focus_seconds >= 0), check (ended_at >= started_at)
);
create table public.active_timer (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, is_demo boolean not null default false,
  mode text not null, phase text not null default 'focus' check (phase in ('focus','break','long_break')),
  cycle_index integer not null default 0,
  status text not null check (status in ('running','paused')),
  phase_target_seconds integer, resumed_at timestamptz, accumulated_seconds integer not null default 0,
  phase_started_at timestamptz not null default now(),
  config jsonb not null default '{}',
  course_id uuid references public.courses(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null, goal text
);
create table public.sound_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, is_demo boolean not null default false,
  name text not null, mix jsonb not null default '{}', is_favourite boolean not null default false, position integer not null default 0
);

-- indexes
create index on public.deadlines (user_id, due_at);
create index on public.tasks (user_id, status, due_date);
create index on public.events (user_id, start_at);
create index on public.study_sessions (user_id, started_at);
create index on public.courses (user_id, semester_id);
create index on public.course_meetings (user_id, course_id);

-- triggers + RLS on every table
do $$
declare t text;
begin
  foreach t in array array['semesters','semester_breaks','courses','course_meetings','events','event_overrides',
    'deadlines','tasks','subtasks','study_sessions','active_timer','sound_presets'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (user_id = auth.uid())', t || '_sel', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (user_id = auth.uid())', t || '_ins', t);
    execute format('create policy %I on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t || '_upd', t);
    execute format('create policy %I on public.%I for delete to authenticated using (user_id = auth.uid())', t || '_del', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
create policy profiles_sel on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_ins on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_upd on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_del on public.profiles for delete to authenticated using (id = auth.uid());

-- only one current semester
create or replace function public.set_current_semester(p_id uuid) returns void
language sql security invoker as $$
  update public.semesters set is_current = (id = p_id) where user_id = auth.uid() and deleted_at is null;
$$;

-- soft delete / restore a semester with everything under it, in one transaction
create or replace function public.soft_delete_semester(p_id uuid, p_restore boolean default false) returns void
language plpgsql security invoker as $$
declare ts timestamptz := case when p_restore then null else now() end;
begin
  update public.semesters set deleted_at = ts, is_current = case when p_restore then is_current else false end where id = p_id;
  update public.semester_breaks set deleted_at = ts where semester_id = p_id;
  update public.course_meetings set deleted_at = ts where course_id in (select id from public.courses where semester_id = p_id);
  update public.deadlines set deleted_at = ts where course_id in (select id from public.courses where semester_id = p_id);
  update public.tasks set deleted_at = ts where course_id in (select id from public.courses where semester_id = p_id);
  update public.events set deleted_at = ts where course_id in (select id from public.courses where semester_id = p_id);
  update public.courses set deleted_at = ts where semester_id = p_id;
end $$;

create or replace function public.soft_delete_course(p_id uuid, p_restore boolean default false) returns void
language plpgsql security invoker as $$
declare ts timestamptz := case when p_restore then null else now() end;
begin
  update public.course_meetings set deleted_at = ts where course_id = p_id;
  update public.deadlines set deleted_at = ts where course_id = p_id;
  update public.tasks set deleted_at = ts where course_id = p_id;
  update public.events set deleted_at = ts where course_id = p_id;
  update public.courses set deleted_at = ts where id = p_id;
end $$;

-- hard-delete soft-deleted rows older than 30 days (called by the app at most once a day)
create or replace function public.purge_deleted() returns void
language plpgsql security invoker as $$
declare t text;
begin
  foreach t in array array['event_overrides','subtasks','study_sessions','sound_presets','tasks','deadlines',
    'events','course_meetings','courses','semester_breaks','semesters'] loop
    execute format('delete from public.%I where user_id = auth.uid() and deleted_at < now() - interval ''30 days''', t);
  end loop;
end $$;
