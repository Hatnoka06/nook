import { moodVsStudy, onTimeByMonth, studyByWeekday, studyByWeekAndCourse, tasksDonePerWeek } from './analytics'

const SYD = 'Australia/Sydney'
const sess = (started_at: string, focus_seconds: number, course_id: string | null = null) => ({ started_at, focus_seconds, course_id })

describe('studyByWeekday', () => {
  it('Monday-first, minutes per weekday in the zone', () => {
    // 2026-11-23 is a Monday. 2026-11-22T20:00Z = Mon 07:00 Sydney
    const r = studyByWeekday([sess('2026-11-22T20:00:00Z', 3600), sess('2026-11-25T01:00:00Z', 1800)], '2026-11-16', '2026-11-29', SYD)
    expect(r).toEqual([60, 0, 30, 0, 0, 0, 0])
  })
  it('ignores sessions outside the range', () => expect(studyByWeekday([sess('2026-10-01T00:00:00Z', 3600)], '2026-11-16', '2026-11-29', SYD).every((m) => m === 0)).toBe(true))
})
describe('studyByWeekAndCourse', () => {
  it('groups by Monday-start week and course', () => {
    const r = studyByWeekAndCourse([sess('2026-11-17T01:00:00Z', 1800, 'a'), sess('2026-11-18T01:00:00Z', 1800, 'b'), sess('2026-11-24T01:00:00Z', 3600, 'a')], '2026-11-16', '2026-11-29', SYD)
    expect(r.map((w) => w.week)).toEqual(['2026-11-16', '2026-11-23'])
    expect(r[0].byCourse.get('a')).toBe(30); expect(r[0].byCourse.get('b')).toBe(30); expect(r[1].byCourse.get('a')).toBe(60)
  })
})
describe('onTimeByMonth', () => {
  const d = (due_at: string, completed_at: string | null, status = completed_at ? 'submitted' : 'not_started') => ({ due_at, completed_at, status })
  const NOW = new Date('2026-11-21T00:00:00Z')
  it('counts submitted before the due time as on time; past-due and not submitted as late; future ones are skipped', () => {
    const r = onTimeByMonth([d('2026-10-10T00:00:00Z', '2026-10-09T00:00:00Z'), d('2026-10-20T00:00:00Z', '2026-10-21T00:00:00Z'), d('2026-10-25T00:00:00Z', null), d('2026-12-01T00:00:00Z', null)], SYD, NOW)
    expect(r).toEqual([{ month: '2026-10', total: 3, onTime: 1, rate: 1 / 3 }])
  })
})
describe('tasksDonePerWeek', () => {
  it('counts completions per week', () => {
    const r = tasksDonePerWeek([{ completed_at: '2026-11-17T01:00:00Z' }, { completed_at: '2026-11-18T01:00:00Z' }, { completed_at: '2026-11-24T01:00:00Z' }, { completed_at: null }], '2026-11-16', '2026-11-29', SYD)
    expect(r).toEqual([{ week: '2026-11-16', count: 2 }, { week: '2026-11-23', count: 1 }])
  })
})
describe('moodVsStudy', () => {
  const days = (n: number) => Array.from({ length: n }, (_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, mood: 3 }))
  it('needs at least 14 days of mood data', () => {
    expect(moodVsStudy(days(13), [], SYD).enough).toBe(false); expect(moodVsStudy(days(14), [], SYD).enough).toBe(true)
  })
  it('joins study minutes per day', () => {
    const r = moodVsStudy(days(14), [sess('2026-11-01T01:00:00Z', 1800)], SYD)
    expect(r.points[0]).toMatchObject({ date: '2026-11-01', mood: 3, minutes: 30 })
  })
})
