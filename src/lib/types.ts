export type Base = { id: string; user_id: string; created_at: string; updated_at: string; deleted_at: string | null; is_demo: boolean }
export type Profile = {
  id: string; display_name: string | null; university: string | null; language: 'en' | 'vi'; theme: 'light' | 'dark' | 'system'
  time_zone: string; week_starts_on: 0 | 1; daily_study_goal_minutes: number; water_goal_ml: number; sleep_goal_hours: number
  widget_visibility: Record<string, boolean>; background_id: import('./appearance').BackgroundId; reduce_effects: boolean; onboarded: boolean
}
export type Semester = Base & { name: string; start_date: string; end_date: string; is_current: boolean; week1_start: string | null }
export type SemesterBreak = Base & { semester_id: string; name: string; start_date: string; end_date: string; counts_as_week: boolean }
export type Course = Base & { code: string; name: string; kind: 'uni' | 'self'; semester_id: string | null; lecturer: string | null; color: string; is_archived: boolean; credit_points: number; target_grade: 'P' | 'Cr' | 'D' | 'HD' | null }
export type MeetingType = 'lecture' | 'tutorial' | 'workshop' | 'practical' | 'sgta' | 'other'
export type Meeting = Base & {
  course_id: string; type: MeetingType; weekday: number; start_time: string; end_time: string; location: string | null
  from_date: string | null; to_date: string | null; week_pattern: 'every' | 'odd' | 'even'; skipped_dates: string[]
}
export type RepeatRule = { freq: 'daily' | 'weekdays' | 'weekly'; interval: 1 | 2; by_weekday?: number[]; until?: string | null }
export type EventType = 'class' | 'routine' | 'learn' | 'meeting' | 'work' | 'personal' | 'other'
export type CalEvent = Base & {
  title: string; type: EventType; start_at: string; end_at: string; all_day: boolean; location: string | null
  description: string | null; time_zone: string; repeat_rule: RepeatRule | null; course_id: string | null
}
export type EventOverride = Base & { event_id: string; occurrence_date: string; is_cancelled: boolean; title: string | null; start_at: string | null; end_at: string | null }
export type Priority = 'low' | 'medium' | 'high'
export type Deadline = Base & {
  title: string; course_id: string | null; type: 'assignment' | 'quiz' | 'exam' | 'presentation' | 'other'; due_at: string
  weight_percent: number | null; priority: Priority; status: 'not_started' | 'in_progress' | 'submitted'
  progress_percent: number | null; estimated_hours: number | null; location: string | null; url: string | null
  description: string | null; completed_at: string | null
}
export type Task = Base & {
  title: string; notes: string | null; due_date: string | null; due_time: string | null; priority: Priority
  category: 'study' | 'work' | 'personal' | 'admin'; course_id: string | null; deadline_id: string | null
  estimated_minutes: number | null; is_top: boolean; status: 'todo' | 'done'; completed_at: string | null
}
export type Subtask = Base & { task_id: string; title: string; is_done: boolean; position: number }
export type StudyMode = 'pomodoro' | 'deep_work' | 'custom' | 'stopwatch' | 'manual'
export type StudySession = Base & {
  course_id: string | null; task_id: string | null; goal: string | null; mode: StudyMode
  started_at: string; ended_at: string; focus_seconds: number
}
export type ActiveTimer = Base & {
  mode: StudyMode; phase: 'focus' | 'break' | 'long_break'; cycle_index: number; status: 'running' | 'paused'
  phase_target_seconds: number | null; resumed_at: string | null; accumulated_seconds: number; phase_started_at: string
  config: Record<string, number>; course_id: string | null; task_id: string | null; goal: string | null
}
export type SoundPreset = Base & { name: string; mix: Record<string, number>; is_favourite: boolean; position: number }

export const COURSE_COLORS = ['#8B83C8', '#7FA3C7', '#8FAE8F', '#D9A3B0', '#E3B48F', '#CDBE8A', '#86B8B2', '#A39BB4']

export type Assessment = Base & { course_id: string; name: string; weight_pct: number; mark: number | null; max_mark: number; hurdle: boolean; hurdle_min_pct: number | null; deadline_id: string | null }
export type CourseResult = Base & { course_id: string; final_grade: 'HD' | 'D' | 'Cr' | 'P' | 'F' | null; final_mark: number | null; credit_points: number }
export type Note = Base & { title: string; body: string; pinned: boolean; course_id: string | null; deadline_id: string | null; task_id: string | null }
export type Checkin = Base & { date: string; mood: number | null; energy: number | null; sleep_hours: number | null; water_ml: number; note: string | null }
export type Habit = Base & { name: string; sort_order: number; archived: boolean }
export type HabitLog = Base & { habit_id: string; date: string; done: boolean }
export type FinCategory = Base & { name: string; color: string; kind: 'expense' | 'income'; sort_order: number; hidden: boolean }
export type Txn = Base & { date: string; amount_cents: number; type: 'expense' | 'income'; category_id: string | null; note: string | null; currency: string; recurring_id: string | null }
export type Budget = Base & { category_id: string; month: string; limit_cents: number }
export type Recurring = Base & { title: string; amount_cents: number; type: 'expense' | 'income'; category_id: string | null; frequency: 'weekly' | 'fortnightly' | 'monthly'; next_date: string; end_date: string | null; anchor_day: number | null }
export type Vocab = Base & {
  language: 'zh' | 'es'; term: string; reading: string | null; hanviet: string | null; pos: string | null; meaning_en: string | null; meaning_vi: string | null
  example: string | null; example_reading: string | null; example_en: string | null; example_vi: string | null; notes: string | null
  box: number; due_date: string | null; last_reviewed_at: string | null; reviews: number; is_builtin: boolean
}
