import { INTERVALS, review, dueCount } from './srs'

describe('spaced repetition (Leitner)', () => {
  const T = '2026-11-21'
  it('again resets to box 0, due today', () => expect(review(3, 'again', T)).toEqual({ box: 0, due: T }))
  it('hard keeps the box, due tomorrow', () => expect(review(2, 'hard', T)).toEqual({ box: 2, due: '2026-11-22' }))
  it('good moves up one box', () => expect(review(1, 'good', T)).toEqual({ box: 2, due: '2026-11-21'.replace('21', String(21 + INTERVALS[2])) }))
  it('easy jumps two boxes', () => expect(review(0, 'easy', T).box).toBe(2))
  it('caps at the last box', () => expect(review(INTERVALS.length - 1, 'easy', T).box).toBe(INTERVALS.length - 1))
  it('counts due cards', () => expect(dueCount([{ due_date: '2026-11-20' }, { due_date: T }, { due_date: '2026-11-22' }, { due_date: null }], T)).toBe(3))
})
