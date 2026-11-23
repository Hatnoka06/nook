import type { TFunction } from 'i18next'
import type { Countdown } from './time'

export function countdownLabel(t: TFunction, c: Countdown): string {
  const key = `cd.${c.unit}${c.overdue ? 'Over' : 'Left'}`
  return t(key, { count: c.value })
}
