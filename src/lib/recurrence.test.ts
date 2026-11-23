import type { CalEvent, Course, EventOverride, Meeting, Semester, SemesterBreak } from './types'
import { expandEvent, expandMeetings } from './recurrence'
import { fromInputLocal } from './time'

const SYD = 'Australia/Sydney'
const ev = (o: Partial<CalEvent> = {}): CalEvent => ({ id: 'e1', user_id: 'u', created_at: '', updated_at: '', deleted_at: null, is_demo: false, title: 'Gym', type: 'personal',
  start_at: fromInputLocal('2026-09-28T08:00', SYD), end_at: fromInputLocal('2026-09-28T09:00', SYD), all_day: false, location: null, description: null, time_zone: SYD,
  repeat_rule: { freq: 'weekly', interval: 1, by_weekday: [1], until: null }, course_id: null, ...o })
const starts = (os: { start: string }[]) => os.map((o) => o.start)

describe('expandEvent', () => {
  const R = ['2026-09-27T00:00:00Z', '2026-10-12T00:00:00Z'] as const
  it('keeps 08:00 local across the Sydney DST change (Oct 4 2026)', () => {
    expect(starts(expandEvent(ev(), [], ...R))).toEqual(['2026-09-27T22:00:00.000Z', '2026-10-04T21:00:00.000Z', '2026-10-11T21:00:00.000Z'])
  })
  it('keeps the same duration', () => {
    const o = expandEvent(ev(), [], ...R)[1]
    expect(+new Date(o.end) - +new Date(o.start)).toBe(3600000)
  })
  it('every 2 weeks', () => {
    expect(expandEvent(ev({ repeat_rule: { freq: 'weekly', interval: 2, by_weekday: [1] } }), [], ...R)).toHaveLength(2)
  })
  it('weekdays skips the weekend', () => {
    const e = ev({ start_at: fromInputLocal('2026-11-20T08:00', SYD), end_at: fromInputLocal('2026-11-20T09:00', SYD), repeat_rule: { freq: 'weekdays', interval: 1 } })
    expect(expandEvent(e, [], '2026-11-19T00:00:00Z', '2026-11-23T00:00:00Z')).toHaveLength(2) // Fri 20, Mon 23
  })
  it('daily', () => {
    const e = ev({ repeat_rule: { freq: 'daily', interval: 1 } })
    expect(expandEvent(e, [], '2026-09-26T00:00:00Z', '2026-10-01T00:00:00Z')).toHaveLength(4)
  })
  it('until is inclusive', () => {
    const r = expandEvent(ev({ repeat_rule: { freq: 'weekly', interval: 1, by_weekday: [1], until: '2026-10-05' } }), [], ...R)
    expect(r).toHaveLength(2)
  })
  it('single event outside range is dropped, inside is kept', () => {
    const one = ev({ repeat_rule: null })
    expect(expandEvent(one, [], ...R)).toHaveLength(1)
    expect(expandEvent(one, [], '2026-11-01T00:00:00Z', '2026-11-30T00:00:00Z')).toHaveLength(0)
  })
  it('override: cancel one occurrence, retitle another', () => {
    const ov = (o: Partial<EventOverride>): EventOverride => ({ id: 'o', user_id: 'u', created_at: '', updated_at: '', deleted_at: null, is_demo: false, event_id: 'e1', occurrence_date: '2026-10-05', is_cancelled: false, title: null, start_at: null, end_at: null, ...o })
    const r = expandEvent(ev(), [ov({ is_cancelled: true }), ov({ occurrence_date: '2026-10-12', title: 'Moved' })], ...['2026-09-27T00:00:00Z', '2026-10-13T00:00:00Z'] as const)
    expect(r.map((x) => x.title)).toEqual(['Gym', 'Moved'])
  })
})

const sem: Semester = { id: 's', user_id: 'u', created_at: '', updated_at: '', deleted_at: null, is_demo: false, name: 'S2', start_date: '2026-09-28', end_date: '2026-12-04', is_current: true, week1_start: null }
const course: Course = { id: 'c', user_id: 'u', created_at: '', updated_at: '', deleted_at: null, is_demo: false, code: 'X1', name: 'X', kind: 'uni', semester_id: 's', lecturer: null, color: '#fff', is_archived: false, credit_points: 10, target_grade: null }
const meet = (o: Partial<Meeting> = {}): Meeting => ({ id: 'm', user_id: 'u', created_at: '', updated_at: '', deleted_at: null, is_demo: false, course_id: 'c', type: 'lecture', weekday: 1,
  start_time: '09:00:00', end_time: '10:00:00', location: 'R1', from_date: null, to_date: null, week_pattern: 'every', skipped_dates: [], ...o })
const brk = (o: Partial<SemesterBreak>): SemesterBreak => ({ id: 'b', user_id: 'u', created_at: '', updated_at: '', deleted_at: null, is_demo: false, semester_id: 's', name: 'Break', start_date: '2026-10-12', end_date: '2026-10-18', counts_as_week: false, ...o })
const run = (m: Meeting, breaks: SemesterBreak[] = [], r = ['2026-09-27T00:00:00Z', '2026-10-27T00:00:00Z']) => expandMeetings([m], [course], [sem], breaks, r[0], r[1], SYD)

describe('expandMeetings', () => {
  it('weekly lecture keeps 09:00 local across DST', () => {
    expect(starts(run(meet())).slice(0, 2)).toEqual(['2026-09-27T23:00:00.000Z', '2026-10-04T22:00:00.000Z'])
  })
  it('skips skipped_dates', () => {
    expect(run(meet({ skipped_dates: ['2026-10-12'] })).map((o) => o.date)).not.toContain('2026-10-12')
  })
  it('odd weeks only', () => expect(run(meet({ week_pattern: 'odd' })).map((o) => o.date)).toEqual(['2026-09-28', '2026-10-12', '2026-10-26']))
  it('even weeks only', () => expect(run(meet({ week_pattern: 'even' })).map((o) => o.date)).toEqual(['2026-10-05', '2026-10-19']))
  it('break hides the class and non-counting break shifts the odd/even numbering', () => {
    const dates = run(meet({ week_pattern: 'odd' }), [brk({})]).map((o) => o.date)
    expect(dates).toEqual(['2026-09-28', '2026-10-19']) // Oct 12 is a break; Oct 19 becomes week 3
  })
  it('respects from/to dates and ignores other weekdays', () => {
    expect(run(meet({ from_date: '2026-10-05', to_date: '2026-10-12' })).map((o) => o.date)).toEqual(['2026-10-05', '2026-10-12'])
    expect(run(meet({ weekday: 3 })).every((o) => new Date(o.date + 'T00:00:00Z').getUTCDay() === 3)).toBe(true)
  })
  it('self-study course has no semester bounds', () => {
    const self = { ...course, kind: 'self' as const, semester_id: null }
    const r = expandMeetings([meet()], [self], [], [], '2027-01-01T00:00:00Z', '2027-01-20T00:00:00Z', SYD)
    expect(r.length).toBeGreaterThan(0)
  })
})
