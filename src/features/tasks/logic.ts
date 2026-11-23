import type { Task } from '@/lib/types'
import { addDaysISO } from '@/lib/time'

export type Tab = 'today' | 'upcoming' | 'overdue' | 'completed'
export function taskTab(t: Task, today: string): Tab {
  if (t.status === 'done') return 'completed'
  if (!t.due_date) return 'upcoming'
  if (t.due_date < today) return 'overdue'
  return t.due_date === today ? 'today' : 'upcoming'
}
export function upcomingGroup(t: Task, today: string): 'week' | 'later' | 'none' {
  if (!t.due_date) return 'none'
  return t.due_date <= addDaysISO(today, 7) ? 'week' : 'later'
}
const RANK = { high: 3, medium: 2, low: 1 }
export function sortTasks(list: Task[]): Task[] {
  return [...list].sort((a, b) =>
    Number(b.is_top) - Number(a.is_top) || RANK[b.priority] - RANK[a.priority] ||
    (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'))
}
export function isRecentCompleted(t: Task, now: Date = new Date()): boolean {
  return t.status === 'done' && !!t.completed_at && +now - +new Date(t.completed_at) <= 30 * 86400000
}
