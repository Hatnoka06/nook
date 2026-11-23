import { addDaysISO } from './time'

/** Days until the next review for each Leitner box. */
export const INTERVALS = [0, 1, 3, 7, 14, 30, 60]
export type Grade = 'again' | 'hard' | 'good' | 'easy'
export function review(box: number, grade: Grade, today: string): { box: number; due: string } {
  const max = INTERVALS.length - 1
  if (grade === 'again') return { box: 0, due: today }
  if (grade === 'hard') return { box, due: addDaysISO(today, 1) }
  const next = Math.min(max, box + (grade === 'easy' ? 2 : 1))
  return { box: next, due: addDaysISO(today, INTERVALS[next]) }
}
/** New cards (no date yet) count as due. */
export const dueCount = (cards: { due_date: string | null }[], today: string) => cards.filter((c) => !c.due_date || c.due_date <= today).length
