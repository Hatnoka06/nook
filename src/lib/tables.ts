/** User data tables, parents before children (used by export, restore and delete-all). */
export const TABLES = ['semesters', 'semester_breaks', 'courses', 'course_meetings', 'events', 'event_overrides', 'deadlines', 'tasks', 'subtasks', 'study_sessions', 'active_timer', 'sound_presets',
  'assessments', 'course_results', 'grade_config', 'notes', 'daily_checkins', 'habits', 'habit_logs', 'finance_categories', 'recurring_transactions', 'transactions', 'budgets', 'vocab'] as const
export const SCHEMA_VERSION = 3
