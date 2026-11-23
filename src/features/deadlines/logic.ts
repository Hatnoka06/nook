import type { Deadline } from '@/lib/types'
import { matchesSearch } from '@/lib/text'
import { todayISO } from '@/lib/time'

export type DeadlineFilters = { course: string; type: string; status: string; priority: string; from: string; to: string; q: string; showOld: boolean }

export function filterDeadlines(list: Deadline[], f: DeadlineFilters, now: Date, tz: string): Deadline[] {
  return list.filter((d) => {
    if (!f.showOld && d.status === 'submitted' && d.completed_at && +now - +new Date(d.completed_at) > 7 * 86400000) return false
    if (f.course && d.course_id !== f.course) return false
    if (f.type && d.type !== f.type) return false
    if (f.status && d.status !== f.status) return false
    if (f.priority && d.priority !== f.priority) return false
    const day = todayISO(tz, new Date(d.due_at))
    if (f.from && day < f.from) return false
    if (f.to && day > f.to) return false
    return matchesSearch(d.title, f.q)
  }).sort((a, b) => a.due_at.localeCompare(b.due_at))
}
