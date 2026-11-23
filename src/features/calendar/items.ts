import { expandEvent, expandMeetings } from '@/lib/recurrence'
import { todayISO } from '@/lib/time'
import type { CalEvent, Course, Deadline, EventOverride, Meeting, Semester, SemesterBreak, Task } from '@/lib/types'

export type CalItem = {
  key: string; kind: 'class' | 'event' | 'deadline' | 'task'; title: string; start: string; end: string; allDay: boolean
  courseId: string | null; type: string; location: string | null; day: string; recurring: boolean; ref: unknown; sourceId: string; occDate?: string
}
export type CalData = { events: CalEvent[]; overrides: EventOverride[]; meetings: Meeting[]; courses: Course[]; semesters: Semester[]; breaks: SemesterBreak[]; deadlines: Deadline[]; tasks: Task[] }

/** Everything shown on the calendar in [rangeStart, rangeEnd), as one flat list. */
export function buildItems(d: CalData, rangeStart: string, rangeEnd: string, tz: string, showTasks: boolean): CalItem[] {
  const out: CalItem[] = []
  for (const o of expandMeetings(d.meetings, d.courses, d.semesters, d.breaks, rangeStart, rangeEnd, tz))
    out.push({ key: o.key, kind: 'class', title: o.title, start: o.start, end: o.end, allDay: false, courseId: o.courseId, type: o.type, location: o.location, day: todayISO(tz, new Date(o.start)), recurring: true, ref: d.meetings.find((m) => m.id === o.sourceId), sourceId: o.sourceId, occDate: o.date })
  for (const ev of d.events)
    for (const o of expandEvent(ev, d.overrides, rangeStart, rangeEnd))
      out.push({ key: o.key, kind: 'event', title: o.title, start: o.start, end: o.end, allDay: o.allDay, courseId: o.courseId, type: o.type, location: o.location, day: todayISO(tz, new Date(o.start)), recurring: o.recurring, ref: ev, sourceId: ev.id, occDate: o.date })
  for (const dl of d.deadlines)
    if (dl.due_at >= rangeStart && dl.due_at < rangeEnd)
      out.push({ key: `dl:${dl.id}`, kind: 'deadline', title: dl.title, start: dl.due_at, end: dl.due_at, allDay: false, courseId: dl.course_id, type: dl.type, location: dl.location, day: todayISO(tz, new Date(dl.due_at)), recurring: false, ref: dl, sourceId: dl.id })
  if (showTasks)
    for (const t of d.tasks)
      if (t.due_date && t.status === 'todo') {
        const s = new Date(`${t.due_date}T12:00:00Z`).toISOString()
        if (s >= rangeStart.slice(0, 10) && todayISO(tz, new Date(rangeStart)) <= t.due_date && t.due_date <= todayISO(tz, new Date(+new Date(rangeEnd) - 1)))
          out.push({ key: `t:${t.id}`, kind: 'task', title: t.title, start: s, end: s, allDay: true, courseId: t.course_id, type: 'task', location: null, day: t.due_date, recurring: false, ref: t, sourceId: t.id })
      }
  return out.sort((a, b) => a.start.localeCompare(b.start))
}
