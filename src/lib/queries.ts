import { useMemo } from 'react'
import { useProfile } from '@/features/auth/useProfile'
import { useRows } from './data'
import type { ActiveTimer, Assessment, Budget, Checkin, CourseResult, FinCategory, Habit, HabitLog, Note, Recurring, Txn, Vocab, CalEvent, Course, Deadline, EventOverride, Meeting, Semester, SemesterBreak, SoundPreset, StudySession, Subtask, Task } from './types'

export const useSemesters = () => useRows<Semester>('semesters', { order: 'start_date' })
export const useBreaks = () => useRows<SemesterBreak>('semester_breaks')
export const useCourses = () => useRows<Course>('courses', { order: 'code' })
export const useMeetings = () => useRows<Meeting>('course_meetings')
export const useEvents = () => useRows<CalEvent>('events')
export const useOverrides = () => useRows<EventOverride>('event_overrides')
export const useDeadlines = () => useRows<Deadline>('deadlines', { order: 'due_at' })
export const useTasks = () => useRows<Task>('tasks')
export const useSubtasks = () => useRows<Subtask>('subtasks', { order: 'position' })
export const useSessions = () => useRows<StudySession>('study_sessions', { order: 'started_at' })
export const usePresets = () => useRows<SoundPreset>('sound_presets', { order: 'position' })
export const useActiveTimer = () => useRows<ActiveTimer>('active_timer')

export const useTz = () => useProfile().profile?.time_zone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
export function useCurrentSemester() {
  const { data } = useSemesters()
  return useMemo(() => data?.find((s) => s.is_current), [data])
}
export function useCourseMap() {
  const { data } = useCourses()
  return useMemo(() => new Map((data ?? []).map((c) => [c.id, c])), [data])
}

export const useAssessments = () => useRows<Assessment>('assessments')
export const useResults = () => useRows<CourseResult>('course_results')
export const useNotes = () => useRows<Note>('notes')
export const useCheckins = () => useRows<Checkin>('daily_checkins', { order: 'date' })
export const useHabits = () => useRows<Habit>('habits', { order: 'sort_order' })
export const useHabitLogs = () => useRows<HabitLog>('habit_logs')
export const useFinCategories = () => useRows<FinCategory>('finance_categories', { order: 'sort_order' })
export const useTxns = () => useRows<Txn>('transactions', { order: 'date' })
export const useBudgets = () => useRows<Budget>('budgets')
export const useRecurring = () => useRows<Recurring>('recurring_transactions')
export const useVocab = () => useRows<Vocab>('vocab')
