import { describe, expect, it } from 'vitest'
import { fpsFor, isStuttering, perfLevel, setPerfMode, stepDown } from './perf'

describe('performance levels', () => {
  it('detects stutter from real frame gaps', () => {
    expect(isStuttering(Array(60).fill(16.7))).toBe(false)
    expect(isStuttering(Array(60).fill(28))).toBe(true)
    expect(isStuttering([...Array(48).fill(16.7), ...Array(12).fill(50)])).toBe(true)
    expect(isStuttering(Array(10).fill(80))).toBe(false) // too little evidence
  })
  it('auto steps down at most to light, and a fixed mode wins', () => {
    setPerfMode('auto'); expect(perfLevel()).toBe(0)
    stepDown(); stepDown(); stepDown(); expect(perfLevel()).toBe(2)
    setPerfMode('high'); stepDown(); expect(perfLevel()).toBe(0)
    setPerfMode('auto'); expect(perfLevel()).toBe(0)
  })
  it('lighter levels animate less', () => {
    expect(fpsFor(0, true)).toBeGreaterThan(fpsFor(1, true))
    expect(fpsFor(2, false)).toBe(0)
  })
})
