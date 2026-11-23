-- UniFlow phase 2: grades, notes, check-in (sleep, water, mood, habits), finance. Safe to run on a database that already has v1 data.
alter table public.courses add column if not exists credit_points numeric not null default 10;
alter table public.courses add column if not exists target_grade text check (target_grade in ('P','Cr','D','HD'));
alter table public.profiles add column if not exists water_goal_ml integer not null default 2000 check (water_goal_ml between 0 and 10000);
alter table public.profiles add column if not exists sleep_goal_hours numeric not null default 8 check (sleep_goal_hours between 0 and 14);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, is_demo boolean not null default false,
  course_id uuid not null references public.courses(id) on delete cascade, name text not null,
  weight_pct numeric not null default 0 check (weight_pct between 0 and 100), mark numeric check (mark >= 0), max_mark numeric not null default 100 check (max_mark > 0),
  hurdle boolean not null default false, hurdle_min_pct numeric check (hurdle_min_pct between 0 and 100),
  deadline_id uuid references public.deadlines(id) on delete set null
);
create table public.course_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, is_demo boolean not null default false,
  course_id uuid not null references public.courses(id) on delete cascade, final_grade text check (final_grade in ('HD','D','Cr','P','F')),
  final_mark numeric check (final_mark between 0 and 100), credit_points numeric not null default 10
);
create table public.grade_config (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, is_demo boolean not null default false,
  grade text not null, min_mark numeric not null, gpa_points numeric not null
);
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, is_demo boolean not null default false,
  title text not null default '', body text not null default '' check (char_length(body) <= 100000), pinned boolean not null default false,
  course_id uuid references public.courses(id) on delete set null, deadline_id uuid references public.deadlines(id) on delete set null, task_id uuid references public.tasks(id) on delete set null
);
create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, is_demo boolean not null default false,
  date date not null, mood smallint check (mood between 1 and 5), energy smallint check (energy between 1 and 5),
  sleep_hours numeric check (sleep_hours between 0 and 14), water_ml integer not null default 0 check (water_ml between 0 and 20000),
  note text check (char_length(note) <= 280), unique (user_id, date)
);
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, is_demo boolean not null default false,
  name text not null, sort_order integer not null default 0, archived boolean not null default false
);
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, is_demo boolean not null default false,
  habit_id uuid not null references public.habits(id) on delete cascade, date date not null, done boolean not null default true, unique (habit_id, date)
);
create table public.finance_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, is_demo boolean not null default false,
  name text not null, color text not null default '#8B83C8', kind text not null default 'expense' check (kind in ('expense','income')),
  sort_order integer not null default 0, hidden boolean not null default false
);
create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, is_demo boolean not null default false,
  title text not null default '', amount_cents bigint not null check (amount_cents > 0), type text not null check (type in ('expense','income')),
  category_id uuid references public.finance_categories(id) on delete set null,
  frequency text not null check (frequency in ('weekly','fortnightly','monthly')), next_date date not null, end_date date, anchor_day smallint check (anchor_day between 1 and 31)
);
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, is_demo boolean not null default false,
  date date not null, amount_cents bigint not null check (amount_cents > 0), type text not null check (type in ('expense','income')),
  category_id uuid references public.finance_categories(id) on delete set null, note text, currency text not null default 'AUD',
  recurring_id uuid references public.recurring_transactions(id) on delete set null
);
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, is_demo boolean not null default false,
  category_id uuid not null references public.finance_categories(id) on delete cascade, month date not null, limit_cents bigint not null check (limit_cents >= 0),
  unique (category_id, month)
);
create index on public.transactions (user_id, date);
create index on public.notes (user_id, updated_at desc);
create index on public.daily_checkins (user_id, date);
create index on public.assessments (user_id, course_id);

do $$
declare t text;
begin
  foreach t in array array['assessments','course_results','grade_config','notes','daily_checkins','habits','habit_logs','finance_categories','recurring_transactions','transactions','budgets'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (user_id = auth.uid())', t || '_sel', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (user_id = auth.uid())', t || '_ins', t);
    execute format('create policy %I on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t || '_upd', t);
    execute format('create policy %I on public.%I for delete to authenticated using (user_id = auth.uid())', t || '_del', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- purge soft-deleted rows older than 30 days, now for every table
create or replace function public.purge_deleted() returns void
language plpgsql security invoker as $$
declare t text;
begin
  foreach t in array array['event_overrides','subtasks','study_sessions','sound_presets','assessments','course_results','grade_config','notes','habit_logs','habits',
    'transactions','budgets','recurring_transactions','finance_categories','tasks','deadlines','events','course_meetings','courses','semester_breaks','semesters'] loop
    execute format('delete from public.%I where user_id = auth.uid() and deleted_at < now() - interval ''30 days''', t);
  end loop;
end $$;
