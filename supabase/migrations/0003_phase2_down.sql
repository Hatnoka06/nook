-- Undo 0003 (drops phase-2 data!). Export first.
drop table if exists public.budgets, public.transactions, public.recurring_transactions, public.finance_categories, public.habit_logs, public.habits,
  public.daily_checkins, public.notes, public.grade_config, public.course_results, public.assessments cascade;
alter table public.courses drop column if exists credit_points, drop column if exists target_grade;
alter table public.profiles drop column if exists water_goal_ml, drop column if exists sleep_goal_hours;
