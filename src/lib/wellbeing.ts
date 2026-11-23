import { addDaysISO } from './time'

/** Consecutive days with a check-in, ending today (or yesterday if today is not done yet). A missed day resets to 0. */
export function checkinStreak(dates: string[], today: string): number {
  const set = new Set(dates)
  let d = set.has(today) ? today : addDaysISO(today, -1)
  let n = 0
  while (set.has(d)) { n++; d = addDaysISO(d, -1) }
  return n
}
/** Only the last 7 days (today included) can be edited; older days are read-only. */
export const canEdit = (date: string, today: string): boolean => date <= today && date >= addDaysISO(today, -6)
export const waterRatio = (ml: number, goal: number): number => (goal > 0 ? Math.min(1, ml / goal) : 0)
export const MOOD_COLORS = ['#A99BD8', '#8FB1D6', '#8CC4BC', '#F0C29A', '#F5D57A'] // violet → blue → teal → peach → sun; calm, never red
