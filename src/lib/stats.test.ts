import { minutesByCourse, minutesByDay } from './stats'

const s = (started_at: string, focus_seconds: number, course_id: string | null = null) => ({ started_at, focus_seconds, course_id })
describe('study stats', () => {
  it('groups minutes by local day in the zone', () => {
    // 2026-11-20T20:00Z is 2026-11-21 in Sydney
    const rows = [s('2026-11-20T20:00:00Z', 1800), s('2026-11-21T01:00:00Z', 600), s('2026-11-20T00:00:00Z', 3600)]
    expect(minutesByDay(rows, ['2026-11-20', '2026-11-21'], 'Australia/Sydney')).toEqual([{ day: '2026-11-20', minutes: 60 }, { day: '2026-11-21', minutes: 40 }])
  })
  it('groups by course within a range', () => {
    const rows = [s('2026-11-21T00:00:00Z', 1200, 'a'), s('2026-11-21T02:00:00Z', 600, 'a'), s('2026-11-21T03:00:00Z', 600, null), s('2026-10-01T00:00:00Z', 600, 'a')]
    const r = minutesByCourse(rows, '2026-11-16T00:00:00Z', '2026-11-23T00:00:00Z')
    expect(r.find((x) => x.course_id === 'a')?.minutes).toBe(30)
    expect(r.find((x) => x.course_id === null)?.minutes).toBe(10)
  })
})
