import { DateTime } from 'luxon'
import { addDaysISO, semesterWeek, startOfWeekISO } from './time'
import type { CalEvent, Course, EventOverride, Meeting, Semester, SemesterBreak } from './types'

export type Occurrence = {
  key: string; source: 'event' | 'meeting'; sourceId: string; date: string // local date in the source's own zone
  start: string; end: string; allDay: boolean; title: string; type: string; courseId: string | null; location: string | null; recurring: boolean
}

const MS_DAY = 86400000
const dateOf = (iso: string, tz: string) => DateTime.fromISO(iso, { zone: 'utc' }).setZone(tz).toISODate()!
const wallMs = (iso: string, tz: string) => { const d = DateTime.fromISO(iso, { zone: 'utc' }).setZone(tz); return Date.UTC(d.year, d.month - 1, d.day, d.hour, d.minute, d.second) }
const clock = (iso: string, tz: string) => DateTime.fromISO(iso, { zone: 'utc' }).setZone(tz).toFormat('HH:mm:ss')
const atLocal = (date: string, time: string, tz: string) => DateTime.fromISO(`${date}T${time}`, { zone: tz })
const isoDow = (date: string) => DateTime.fromISO(date, { zone: 'utc' }).weekday

/**
 * Expand an event into occurrences intersecting [rangeStart, rangeEnd) (UTC ISO strings).
 * Recurrence is computed on local wall-clock time in the event's own zone, so 08:00 stays 08:00 across DST.
 */
export function expandEvent(ev: CalEvent, overrides: EventOverride[], rangeStart: string, rangeEnd: string): Occurrence[] {
  const tz = ev.time_zone, rule = ev.repeat_rule
  const firstDate = dateOf(ev.start_at, tz), startClock = clock(ev.start_at, tz)
  const wallDur = wallMs(ev.end_at, tz) - wallMs(ev.start_at, tz)
  const base = { source: 'event' as const, sourceId: ev.id, allDay: ev.all_day, type: ev.type, courseId: ev.course_id, location: ev.location, recurring: Boolean(rule) }
  const make = (date: string): Occurrence | null => {
    const s = atLocal(date, startClock, tz)
    // end = same local wall-clock duration, so a 1h class stays 1h-on-the-clock across DST
    const wallEnd = DateTime.fromMillis(Date.UTC(s.year, s.month - 1, s.day, s.hour, s.minute, s.second) + wallDur, { zone: 'utc' })
    const e = rule ? DateTime.fromObject({ year: wallEnd.year, month: wallEnd.month, day: wallEnd.day, hour: wallEnd.hour, minute: wallEnd.minute, second: wallEnd.second }, { zone: tz })
      : s.plus({ milliseconds: +new Date(ev.end_at) - +new Date(ev.start_at) })
    const ov = overrides.find((o) => o.event_id === ev.id && o.occurrence_date === date && !o.deleted_at)
    if (ov?.is_cancelled) return null
    const start = ov?.start_at ?? s.toUTC().toISO()!, end = ov?.end_at ?? e.toUTC().toISO()!
    if (!(start < rangeEnd && end > rangeStart)) return null
    return { ...base, key: `${ev.id}:${date}`, date, start, end, title: ov?.title ?? ev.title }
  }
  if (!rule) { const o = make(firstDate); return o ? [o] : [] }

  const lo = dateOf(new Date(+new Date(rangeStart) - MS_DAY).toISOString(), tz), hi = dateOf(new Date(+new Date(rangeEnd) + MS_DAY).toISOString(), tz)
  const out: Occurrence[] = []
  const firstWeek = startOfWeekISO(firstDate, 1)
  const weekdays = rule.by_weekday?.length ? rule.by_weekday : [isoDow(firstDate)]
  for (let d = lo < firstDate ? firstDate : lo; d <= hi; d = addDaysISO(d, 1)) {
    if (rule.until && d > rule.until) break
    const dow = isoDow(d)
    let hit = false
    if (rule.freq === 'daily') hit = true
    else if (rule.freq === 'weekdays') hit = dow <= 5
    else {
      const weeks = Math.round((+new Date(startOfWeekISO(d, 1)) - +new Date(firstWeek)) / (7 * MS_DAY))
      hit = weekdays.includes(dow) && weeks % (rule.interval || 1) === 0
    }
    if (!hit) continue
    const o = make(d); if (o) out.push(o)
  }
  return out
}

/** Class times expand straight from course_meetings; they are never duplicated into events rows. */
export function expandMeetings(meetings: Meeting[], courses: Course[], semesters: Semester[], breaks: SemesterBreak[], rangeStart: string, rangeEnd: string, tz: string): Occurrence[] {
  const out: Occurrence[] = []
  const lo = dateOf(new Date(+new Date(rangeStart) - MS_DAY).toISOString(), tz), hi = dateOf(rangeEnd, tz)
  for (const m of meetings) {
    const course = courses.find((c) => c.id === m.course_id); if (!course) continue
    const sem = course.semester_id ? semesters.find((s) => s.id === course.semester_id) : undefined
    const semBreaks = breaks.filter((b) => b.semester_id === sem?.id)
    const from = m.from_date ?? sem?.start_date ?? lo, to = m.to_date ?? sem?.end_date ?? hi
    for (let d = lo > from ? lo : from; d <= hi && d <= to; d = addDaysISO(d, 1)) {
      if (isoDow(d) !== m.weekday || m.skipped_dates.includes(d)) continue
      if (sem) {
        const w = semesterWeek(sem, semBreaks, d)
        if (semBreaks.some((b) => d >= b.start_date && d <= b.end_date)) continue
        if (m.week_pattern !== 'every' && w && w.week % 2 !== (m.week_pattern === 'odd' ? 1 : 0)) continue
      }
      const s = atLocal(d, m.start_time, tz), e = atLocal(d, m.end_time, tz)
      const start = s.toUTC().toISO()!, end = e.toUTC().toISO()!
      if (!(start < rangeEnd && end > rangeStart)) continue
      out.push({ key: `${m.id}:${d}`, source: 'meeting', sourceId: m.id, date: d, start, end, allDay: false, title: course.code, type: m.type, courseId: course.id, location: m.location, recurring: true })
    }
  }
  return out.sort((a, b) => a.start.localeCompare(b.start))
}
