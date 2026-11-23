import { elapsedSeconds, MODES, nextPhase, pauseTimer, remainingSeconds, resumeTimer, shouldSave, phaseEndedAt, type TimerState } from './timer'

const T0 = '2026-11-21T00:00:00.000Z'
const at = (s: number) => new Date(+new Date(T0) + s * 1000)
const base: TimerState = { mode: 'pomodoro', phase: 'focus', cycle_index: 0, status: 'running', phase_target_seconds: 1500, resumed_at: T0, accumulated_seconds: 0, phase_started_at: T0, config: {} }

describe('elapsedSeconds (timestamp based)', () => {
  it('counts from resumed_at, independent of tick count', () => {
    expect(elapsedSeconds(base, at(0))).toBe(0)
    expect(elapsedSeconds(base, at(600))).toBe(600) // a background tab that skipped ticks still reads the true time
  })
  it('adds accumulated time and ignores pause', () => {
    expect(elapsedSeconds({ ...base, accumulated_seconds: 300 }, at(100))).toBe(400)
    expect(elapsedSeconds({ ...base, status: 'paused', resumed_at: null, accumulated_seconds: 300 }, at(9999))).toBe(300)
  })
  it('pause then resume does not count the paused gap', () => {
    const paused = pauseTimer(base, at(120))
    expect(paused.status).toBe('paused'); expect(paused.accumulated_seconds).toBe(120)
    const resumed = resumeTimer(paused, at(1000))
    expect(elapsedSeconds(resumed, at(1060))).toBe(180)
  })
})
describe('remaining / end', () => {
  it('remaining counts down and floors at 0', () => {
    expect(remainingSeconds(base, at(100))).toBe(1400)
    expect(remainingSeconds(base, at(5000))).toBe(0)
    expect(remainingSeconds({ ...base, mode: 'stopwatch', phase_target_seconds: null }, at(10))).toBeNull()
  })
  it('phaseEndedAt is the exact instant the target was reached', () => {
    expect(phaseEndedAt({ ...base, accumulated_seconds: 600 })!.toISOString()).toBe(at(900).toISOString())
  })
})
describe('nextPhase', () => {
  it('pomodoro: break after focus, long break after 4th', () => {
    expect(nextPhase(base)).toMatchObject({ phase: 'break', phase_target_seconds: 300, cycle_index: 0 })
    expect(nextPhase({ ...base, cycle_index: 3 })).toMatchObject({ phase: 'long_break', phase_target_seconds: 900 })
  })
  it('deep work uses 50/10/20 and 3 cycles', () => {
    const d = { ...base, mode: 'deep_work' as const, cycle_index: 2 }
    expect(nextPhase(d)).toMatchObject({ phase: 'long_break', phase_target_seconds: 1200 })
    expect(MODES.deep_work.focus).toBe(3000)
  })
  it('after a break comes the next focus', () => {
    expect(nextPhase({ ...base, phase: 'break' })).toMatchObject({ phase: 'focus', cycle_index: 1, phase_target_seconds: 1500 })
  })
  it('custom mode is a single cycle', () => {
    expect(nextPhase({ ...base, mode: 'custom', config: { focus: 600, break: 60, long: 120, cycles: 1 } })).toMatchObject({ phase: 'long_break', phase_target_seconds: 120 })
  })
})
describe('shouldSave', () => {
  it('keeps 1 minute or more, drops less', () => { expect(shouldSave(60)).toBe(true); expect(shouldSave(59)).toBe(false) })
})
