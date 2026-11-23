import { canEdit, checkinStreak, waterRatio } from './wellbeing'

describe('checkinStreak', () => {
  it('counts consecutive days ending today', () => expect(checkinStreak(['2026-11-19', '2026-11-20', '2026-11-21'], '2026-11-21')).toBe(3))
  it("today not yet done: yesterday's streak still stands", () => expect(checkinStreak(['2026-11-19', '2026-11-20'], '2026-11-21')).toBe(2))
  it('a missed day resets to 0', () => expect(checkinStreak(['2026-11-18', '2026-11-19'], '2026-11-21')).toBe(0))
  it('gaps break the run', () => expect(checkinStreak(['2026-11-17', '2026-11-20', '2026-11-21'], '2026-11-21')).toBe(2))
  it('empty', () => expect(checkinStreak([], '2026-11-21')).toBe(0))
  it('ignores duplicates', () => expect(checkinStreak(['2026-11-21', '2026-11-21'], '2026-11-21')).toBe(1))
})
describe('canEdit', () => {
  it('last 7 days including today are editable', () => {
    expect(canEdit('2026-11-21', '2026-11-21')).toBe(true); expect(canEdit('2026-11-15', '2026-11-21')).toBe(true)
    expect(canEdit('2026-11-14', '2026-11-21')).toBe(false); expect(canEdit('2026-11-22', '2026-11-21')).toBe(false)
  })
})
describe('waterRatio', () => {
  it('caps at 1 and handles a zero goal', () => { expect(waterRatio(500, 2000)).toBe(0.25); expect(waterRatio(3000, 2000)).toBe(1); expect(waterRatio(100, 0)).toBe(0) })
})
