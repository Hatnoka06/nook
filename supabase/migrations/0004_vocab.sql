-- UniFlow: vocabulary decks (Chinese, Spanish) with spaced repetition. Safe on a database with data.
create table public.vocab (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, is_demo boolean not null default false,
  language text not null check (language in ('zh','es')),
  term text not null, reading text, hanviet text, pos text,
  meaning_en text, meaning_vi text,
  example text, example_reading text, example_en text, example_vi text, notes text,
  box smallint not null default 0 check (box between 0 and 6), due_date date, last_reviewed_at timestamptz, reviews integer not null default 0,
  is_builtin boolean not null default false
);
create index on public.vocab (user_id, language, due_date);
create trigger vocab_updated before update on public.vocab for each row execute function public.set_updated_at();
alter table public.vocab enable row level security;
create policy vocab_sel on public.vocab for select to authenticated using (user_id = auth.uid());
create policy vocab_ins on public.vocab for insert to authenticated with check (user_id = auth.uid());
create policy vocab_upd on public.vocab for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy vocab_del on public.vocab for delete to authenticated using (user_id = auth.uid());
grant select, insert, update, delete on public.vocab to authenticated;

create or replace function public.purge_deleted() returns void
language plpgsql security invoker as $$
declare t text;
begin
  foreach t in array array['event_overrides','subtasks','study_sessions','sound_presets','assessments','course_results','grade_config','notes','habit_logs','habits',
    'transactions','budgets','recurring_transactions','finance_categories','vocab','tasks','deadlines','events','course_meetings','courses','semester_breaks','semesters'] loop
    execute format('delete from public.%I where user_id = auth.uid() and deleted_at < now() - interval ''30 days''', t);
  end loop;
end $$;
