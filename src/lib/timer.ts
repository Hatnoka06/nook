import type { StudyMode } from './types'

export type Phase = 'focus' | 'break' | 'long_break'
export type TimerState = {
  mode: StudyMode; phase: Phase; cycle_index: number; status: 'running' | 'paused'
  phase_target_seconds: number | null; resumed_at: string | null; accumulated_seconds: number; phase_started_at: string
  config: Record<string, number>
}
export const MODES = {
  pomodoro: { focus: 1500, break: 300, long: 900, cycles: 4 },
  deep_work: { focus: 3000, break: 600, long: 1200, cycles: 3 },
} as const

/** Seconds of the current phase that actually ran. Derived from timestamps, never from a tick counter. */
export function elapsedSeconds(t: TimerState, now: Date): number {
  const running = t.status === 'running' && t.resumed_at ? Math.max(0, (+now - +new Date(t.resumed_at)) / 1000) : 0
  return Math.floor(t.accumulated_seconds + running)
}
export function remainingSeconds(t: TimerState, now: Date): number | null {
  return t.phase_target_seconds == null ? null : Math.max(0, t.phase_target_seconds - elapsedSeconds(t, now))
}
/** The instant the phase target was (or will be) reached while running; null if paused or open-ended. */
export function phaseEndedAt(t: TimerState): Date | null {
  if (t.status !== 'running' || !t.resumed_at || t.phase_target_seconds == null) return null
  return new Date(+new Date(t.resumed_at) + (t.phase_target_seconds - t.accumulated_seconds) * 1000)
}
export const pauseTimer = (t: TimerState, now: Date): TimerState => ({ ...t, status: 'paused', accumulated_seconds: elapsedSeconds(t, now), resumed_at: null })
export const resumeTimer = (t: TimerState, now: Date): TimerState => ({ ...t, status: 'running', resumed_at: now.toISOString() })

function cfg(t: TimerState) {
  if (t.mode === 'pomodoro' || t.mode === 'deep_work') return MODES[t.mode]
  return { focus: t.config.focus ?? 1500, break: t.config.break ?? 300, long: t.config.long ?? 900, cycles: t.config.cycles ?? 1 }
}
export function targetFor(mode: StudyMode, phase: Phase, config: Record<string, number>): number | null {
  if (mode === 'stopwatch') return null
  const c = cfg({ mode, config } as TimerState)
  return phase === 'focus' ? c.focus : phase === 'break' ? c.break : c.long
}
/** The phase that follows the current one (paused, accumulated 0). */
export function nextPhase(t: TimerState): Pick<TimerState, 'phase' | 'cycle_index' | 'phase_target_seconds'> {
  const c = cfg(t)
  if (t.phase === 'focus') {
    const long = (t.cycle_index + 1) % c.cycles === 0
    const phase: Phase = long ? 'long_break' : 'break'
    return { phase, cycle_index: t.cycle_index, phase_target_seconds: long ? c.long : c.break }
  }
  return { phase: 'focus', cycle_index: t.cycle_index + 1, phase_target_seconds: c.focus }
}
/** Sessions under one minute are dropped silently. */
export const shouldSave = (focusSeconds: number): boolean => focusSeconds >= 60
