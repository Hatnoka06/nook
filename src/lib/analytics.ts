import { addDaysISO, startOfWeekISO, todayISO } from './time'

type S = { started_at: string; focus_seconds: number; course_id: string | null }
const dayOf = (iso: string, tz: string) => todayISO(tz, new Date(iso))
const inRange = (d: string, from: string, to: string) => d >= from && d <= to
const weeksBetween = (from: string, to: string): string[] => { const out: string[] = []; for (let w = startOfWeekISO(from, 1); w <= to; w = addDaysISO(w, 7)) out.push(w); return out }

/** Study minutes per weekday (Mon..Sun) inside [from, to] local dates. */
export function studyByWeekday(rows: S[], from: string, to: string, tz: string): number[] {
  const m = Array(7).fill(0) as number[]
  for (const r of rows) { const d = dayOf(r.started_at, tz); if (!inRange(d, from, to)) continue; const dow = (new Date(d + 'T00:00:00Z').getUTCDay() + 6) % 7; m[dow] += r.focus_seconds / 60 }
  return m.map(Math.round)
}
export function studyByWeekAndCourse(rows: S[], from: string, to: string, tz: string): { week: string; byCourse: Map<string | null, number> }[] {
  const weeks = weeksBetween(from, to).map((week) => ({ week, byCourse: new Map<string | null, number>() }))
  for (const r of rows) {
    const d = dayOf(r.started_at, tz); if (!inRange(d, from, to)) continue
    const w = weeks.find((x) => x.week === startOfWeekISO(d, 1)); if (!w) continue
    w.byCourse.set(r.course_id, Math.round(((w.byCourse.get(r.course_id) ?? 0) * 60 + r.focus_seconds) / 60 * 100) / 100)
  }
  return weeks.map((w) => ({ week: w.week, byCourse: new Map([...w.byCourse].map(([k, v]) => [k, Math.round(v)])) }))
}
/** Share of past-due deadlines handed in before the due time, per month of the due date. */
export function onTimeByMonth(rows: { due_at: string; completed_at: string | null; status: string }[], tz: string, now: Date) {
  const m = new Map<string, { total: number; onTime: number }>()
  for (const r of rows) {
    const submitted = r.status === 'submitted' && r.completed_at
    if (!submitted && +new Date(r.due_at) > +now) continue // still open
    const key = dayOf(r.due_at, tz).slice(0, 7), e = m.get(key) ?? { total: 0, onTime: 0 }
    e.total++; if (submitted && r.completed_at! <= r.due_at) e.onTime++
    m.set(key, e)
  }
  return [...m].sort(([a], [b]) => a.localeCompare(b)).map(([month, e]) => ({ month, total: e.total, onTime: e.onTime, rate: e.onTime / e.total }))
}
export function tasksDonePerWeek(rows: { completed_at: string | null }[], from: string, to: string, tz: string) {
  const weeks = weeksBetween(from, to).map((week) => ({ week, count: 0 }))
  for (const r of rows) { if (!r.completed_at) continue; const d = dayOf(r.completed_at, tz); if (!inRange(d, from, to)) continue; const w = weeks.find((x) => x.week === startOfWeekISO(d, 1)); if (w) w.count++ }
  return weeks
}
/** Two series on a shared date axis. Shown only with >= 14 days of mood data; no correlation is computed. */
export function moodVsStudy(checkins: { date: string; mood: number | null }[], sessions: S[], tz: string) {
  const withMood = checkins.filter((c) => c.mood != null)
  const mins = new Map<string, number>()
  for (const s of sessions) { const d = dayOf(s.started_at, tz); mins.set(d, (mins.get(d) ?? 0) + s.focus_seconds / 60) }
  return { enough: withMood.length >= 14, points: withMood.sort((a, b) => a.date.localeCompare(b.date)).map((c) => ({ date: c.date, mood: c.mood as number, minutes: Math.round(mins.get(c.date) ?? 0) })) }
}
