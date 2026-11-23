import { DateTime } from 'luxon'
import { countdown, dayRangeUtc, semesterWeek, startOfWeekISO, todayISO } from './time'

const SYD = 'Australia/Sydney'
describe('today boundary', () => {
  it('uses local midnight of the zone', () => {
    // 2026-11-20 20:00Z is 2026-11-21 07:00 in Sydney (AEDT)
    expect(todayISO(SYD, new Date('2026-11-20T20:00:00Z'))).toBe('2026-11-21')
    expect(todayISO(SYD, new Date('2026-11-20T12:00:00Z'))).toBe('2026-11-20') // 23:00 Sydney
    expect(todayISO('UTC', new Date('2026-11-20T20:00:00Z'))).toBe('2026-11-20')
  })
  it('dayRangeUtc spans 23h on DST start (2026-10-04) and 25h on DST end (2027-04-04)', () => {
    const h = (d: string) => { const r = dayRangeUtc(d, SYD); return (+new Date(r.end) - +new Date(r.start)) / 3600000 }
    expect(h('2026-10-04')).toBe(23)
    expect(h('2027-04-04')).toBe(25)
    expect(h('2026-11-21')).toBe(24)
  })
})
describe('startOfWeekISO', () => {
  it('monday and sunday starts', () => {
    expect(startOfWeekISO('2026-11-21', 1)).toBe('2026-11-16') // Sat -> Mon
    expect(startOfWeekISO('2026-11-21', 0)).toBe('2026-11-15') // Sat -> Sun
    expect(startOfWeekISO('2026-11-16', 1)).toBe('2026-11-16')
  })
})
describe('semesterWeek', () => {
  const sem = { start_date: '2026-07-27', end_date: '2026-11-01', week1_start: null }
  it('week 1 is the week containing start_date', () => {
    expect(semesterWeek(sem, [], '2026-07-27')?.week).toBe(1)
    expect(semesterWeek(sem, [], '2026-08-03')?.week).toBe(2)
  })
  it('total weeks', () => expect(semesterWeek(sem, [], '2026-08-03')?.total).toBe(14))
  it('non-counting break week is skipped', () => {
    const br = [{ start_date: '2026-09-21', end_date: '2026-09-27', counts_as_week: false }]
    const before = semesterWeek(sem, br, '2026-09-14')!.week
    expect(semesterWeek(sem, br, '2026-09-28')!.week).toBe(before + 1)
    expect(semesterWeek(sem, br, '2026-09-23')).toMatchObject({ inBreak: true })
  })
  it('counting break week is counted', () => {
    const br = [{ start_date: '2026-09-21', end_date: '2026-09-27', counts_as_week: true }]
    const before = semesterWeek(sem, br, '2026-09-14')!.week
    expect(semesterWeek(sem, br, '2026-09-28')!.week).toBe(before + 2)
  })
  it('week1_start override shifts numbering', () => {
    expect(semesterWeek({ ...sem, week1_start: '2026-08-03' }, [], '2026-08-03')?.week).toBe(1)
  })
  it('null outside the semester', () => expect(semesterWeek(sem, [], '2027-01-01')).toBeNull())
})
describe('countdown', () => {
  const now = new Date('2026-11-21T00:00:00Z')
  const at = (ms: number) => new Date(+now + ms).toISOString()
  const H = 3600000
  it('days', () => expect(countdown(at(3 * 24 * H + H), now)).toMatchObject({ unit: 'days', value: 3, overdue: false }))
  it('hours', () => expect(countdown(at(5 * H + 1000), now)).toMatchObject({ unit: 'hours', value: 5 }))
  it('minutes', () => expect(countdown(at(30 * 60000), now)).toMatchObject({ unit: 'minutes', value: 30 }))
  it('overdue days', () => expect(countdown(at(-(2 * 24 * H + H)), now)).toMatchObject({ unit: 'days', value: 2, overdue: true }))
  it('levels', () => {
    expect(countdown(at(-H), now).level).toBe('overdue')
    expect(countdown(at(47 * H), now).level).toBe('soon')
    expect(countdown(at(6 * 24 * H), now).level).toBe('week')
    expect(countdown(at(20 * 24 * H), now).level).toBe('none')
  })
})
it('luxon sanity', () => expect(DateTime.fromISO('2026-11-21').isValid).toBe(true))

import { fromInputLocal, toInputLocal } from './time'
describe('datetime-local conversion', () => {
  it('round trips through Sydney', () => {
    const iso = fromInputLocal('2026-11-21T09:30', 'Australia/Sydney')
    expect(iso).toBe('2026-11-20T22:30:00.000Z')
    expect(toInputLocal(iso, 'Australia/Sydney')).toBe('2026-11-21T09:30')
  })
})
