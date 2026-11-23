import { fillNoise, sleepGain } from './audio'

describe('fillNoise', () => {
  it.each(['white', 'pink', 'brown'] as const)('%s stays within [-1,1] and is not silent', (type) => {
    const a = new Float32Array(20000); fillNoise(type, a)
    expect(Math.max(...a)).toBeLessThanOrEqual(1); expect(Math.min(...a)).toBeGreaterThanOrEqual(-1)
    expect(a.some((x) => Math.abs(x) > 0.05)).toBe(true)
  })
})
describe('sleepGain', () => {
  it('is 1 until the last 10 seconds then ramps to 0', () => {
    expect(sleepGain(60_000)).toBe(1); expect(sleepGain(10_000)).toBe(1)
    expect(sleepGain(5_000)).toBeCloseTo(0.5); expect(sleepGain(0)).toBe(0)
  })
})
