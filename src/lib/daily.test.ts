import { describe, expect, it } from 'vitest'
import { dailyIndex } from './daily'

const days = (from: string, n: number) => Array.from({ length: n }, (_, i) => { const d = new Date(from + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0, 10) })

describe('dailyIndex', () => {
  it('is the same all day and different on every next day', () => {
    expect(dailyIndex('2026-11-22', 36)).toBe(dailyIndex('2026-11-22', 36))
    const seq = days('2026-11-01', 60).map((d) => dailyIndex(d, 36))
    for (let i = 1; i < seq.length; i++) expect(seq[i]).not.toBe(seq[i - 1])
  })
  it('visits every item once before repeating', () => {
    for (const n of [36, 40, 7, 1, 2]) expect(new Set(days('2027-03-05', n).map((d) => dailyIndex(d, n))).size).toBe(n)
  })
  it('a different salt gives a different order', () => {
    const a = days('2026-11-01', 10).map((d) => dailyIndex(d, 40, 'zh')), b = days('2026-11-01', 10).map((d) => dailyIndex(d, 40, 'es'))
    expect(a).not.toEqual(b)
  })
})
