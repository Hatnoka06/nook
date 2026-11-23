import { DateTime } from 'luxon'

/** Local calendar date (YYYY-MM-DD) of an instant in a zone. "Today" always uses this. */
export function todayISO(tz: string, now: Date = new Date()): string {
  return DateTime.fromJSDate(now, { zone: tz }).toISODate()!
}
/** UTC instants for local 00:00 of a date and local 00:00 of the next day. */
export function dayRangeUtc(dateISO: string, tz: string): { start: string; end: string } {
  const s = DateTime.fromISO(dateISO, { zone: tz }).startOf('day')
  return { start: s.toUTC().toISO()!, end: s.plus({ days: 1 }).startOf('day').toUTC().toISO()! }
}
export function addDaysISO(dateISO: string, n: number): string {
  return DateTime.fromISO(dateISO, { zone: 'UTC' }).plus({ days: n }).toISODate()!
}
/** First day of the week containing the date. weekStartsOn: 1 = Monday, 0 = Sunday. */
export function startOfWeekISO(dateISO: string, weekStartsOn: 0 | 1): string {
  const d = DateTime.fromISO(dateISO, { zone: 'UTC' })
  const back = weekStartsOn === 1 ? d.weekday - 1 : d.weekday % 7
  return d.minus({ days: back }).toISODate()!
}

type SemLike = { start_date: string; end_date: string; week1_start: string | null }
type BreakLike = { start_date: string; end_date: string; counts_as_week: boolean }
const inRange = (d: string, a: string, b: string) => d >= a && d <= b

/**
 * Semester week number. Week 1 is the (Monday) week containing week1_start (or start_date).
 * Break weeks with counts_as_week=false are not numbered (numbering skips over them).
 */
export function semesterWeek(sem: SemLike, breaks: BreakLike[], dateISO: string):
  { week: number; total: number; inBreak: boolean } | null {
  if (!inRange(dateISO, sem.start_date, sem.end_date)) return null
  const w1 = startOfWeekISO(sem.week1_start ?? sem.start_date, 1)
  const weekIsSkipped = (monday: string) => breaks.some((b) => !b.counts_as_week && inRange(monday, b.start_date, b.end_date))
  const target = startOfWeekISO(dateISO, 1)
  const last = startOfWeekISO(sem.end_date, 1)
  let n = 0, week = 0
  for (let m = w1; m <= last; m = addDaysISO(m, 7)) {
    if (!weekIsSkipped(m)) n++
    if (m === target) week = n
  }
  const inBreak = breaks.some((b) => inRange(dateISO, b.start_date, b.end_date))
  return { week, total: n, inBreak }
}

export type Countdown = { unit: 'days' | 'hours' | 'minutes'; value: number; overdue: boolean; level: 'overdue' | 'soon' | 'week' | 'none' }
export function countdown(dueISO: string, now: Date = new Date()): Countdown {
  const diff = +new Date(dueISO) - +now
  const abs = Math.abs(diff), H = 3600000
  const overdue = diff < 0
  let unit: Countdown['unit'] = 'minutes', value = Math.max(1, Math.floor(abs / 60000))
  if (abs >= 24 * H) { unit = 'days'; value = Math.floor(abs / (24 * H)) }
  else if (abs >= H) { unit = 'hours'; value = Math.floor(abs / H) }
  const level: Countdown['level'] = overdue ? 'overdue' : diff <= 48 * H ? 'soon' : diff <= 7 * 24 * H ? 'week' : 'none'
  return { unit, value, overdue, level }
}

/** UTC ISO -> value for <input type="datetime-local"> in a zone. */
export function toInputLocal(iso: string, tz: string): string {
  return DateTime.fromISO(iso, { zone: 'utc' }).setZone(tz).toFormat("yyyy-LL-dd'T'HH:mm")
}
/** <input type="datetime-local"> value in a zone -> UTC ISO. */
export function fromInputLocal(local: string, tz: string): string {
  return DateTime.fromISO(local, { zone: tz }).toUTC().toISO()!
}
