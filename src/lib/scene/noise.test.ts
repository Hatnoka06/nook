import { duneLine, hillLine, ridgeLine, valueNoise } from './noise'

describe('scene noise', () => {
  it('value noise is smooth, bounded and deterministic', () => {
    const n = valueNoise(7)
    for (let x = 0; x < 50; x += 0.37) { const v = n(x); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1) }
    expect(Math.abs(n(3.001) - n(3))).toBeLessThan(0.01)
    expect(valueNoise(7)(12.3)).toBe(n(12.3))
  })
  it('ridge line stays inside mean ± amp and differs per seed', () => {
    const a = ridgeLine(1, 400, { mean: 300, amp: 120, freq: 0.006 }), b = ridgeLine(2, 400, { mean: 300, amp: 120, freq: 0.006 })
    expect(a.every((y) => y >= 180 && y <= 420)).toBe(true)
    expect(a.some((y, i) => Math.abs(y - b[i]) > 5)).toBe(true)
  })
})

describe('terrain shapes', () => {
  const o = { mean: 300, amp: 60, freq: 0.01 }
  const maxStep = (a: Float32Array) => Math.max(...Array.from(a).slice(1).map((v, i) => Math.abs(v - a[i])))
  it('hills stay in range and are gentler than ridges', () => {
    const hl = hillLine(5, 600, o), rl = ridgeLine(5, 600, o)
    expect(Math.min(...hl)).toBeGreaterThanOrEqual(o.mean - o.amp - 0.01)
    expect(Math.max(...hl)).toBeLessThanOrEqual(o.mean + o.amp + 0.01)
    expect(maxStep(hl)).toBeLessThan(maxStep(rl))
  })
  it('dunes stay in range and have sharp crests (one steep side)', () => {
    const dl = duneLine(5, 600, o)
    expect(Math.min(...dl)).toBeGreaterThanOrEqual(o.mean - o.amp - 0.01)
    expect(Math.max(...dl)).toBeLessThanOrEqual(o.mean + o.amp + 0.01)
    expect(maxStep(dl)).toBeGreaterThan(maxStep(hillLine(5, 600, o)))
  })
})
