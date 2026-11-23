import { todayISO } from './time'

type S = { started_at: string; focus_seconds: number; course_id: string | null }
export function minutesByDay(rows: S[], days: string[], tz: string): { day: string; minutes: number }[] {
  const sum = new Map(days.map((d) => [d, 0]))
  for (const r of rows) { const d = todayISO(tz, new Date(r.started_at)); if (sum.has(d)) sum.set(d, sum.get(d)! + r.focus_seconds) }
  return days.map((day) => ({ day, minutes: Math.round(sum.get(day)! / 60) }))
}
export function minutesByCourse(rows: S[], startISO: string, endISO: string): { course_id: string | null; minutes: number }[] {
  const m = new Map<string | null, number>()
  for (const r of rows) if (r.started_at >= startISO && r.started_at < endISO) m.set(r.course_id, (m.get(r.course_id) ?? 0) + r.focus_seconds)
  return [...m].map(([course_id, s]) => ({ course_id, minutes: Math.round(s / 60) })).sort((a, b) => b.minutes - a.minutes)
}
