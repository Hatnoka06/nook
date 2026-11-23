import { useEffect, useState } from 'react'
import { todayISO } from './time'

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }

/** Which of `n` items to show on a calendar day: changes every day and walks through all `n` before any repeats. */
export function dailyIndex(dateISO: string, n: number, salt = ''): number {
  if (n <= 1) return 0
  const [y, m, d] = dateISO.split('-').map(Number), day = Math.floor(Date.UTC(y, m - 1, d) / 86400000)
  const step = [7, 11, 13, 17, 19, 23, 29, 31].find((p) => gcd(p, n) === 1 && p % n !== 0) ?? 1
  return (((day * step + hash(salt)) % n) + n) % n
}

/** Today's date that also rolls over at midnight and when the app comes back from the background. */
export function useToday(tz: string): string {
  const [d, setD] = useState(() => todayISO(tz))
  useEffect(() => {
    const check = () => setD(todayISO(tz))
    check()
    const id = setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check); addEventListener('focus', check)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', check); removeEventListener('focus', check) }
  }, [tz])
  return d
}
