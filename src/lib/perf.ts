import { useSyncExternalStore } from 'react'
import { safeGet, safeSet } from './storage'

/** How hard the animated scene works. 'auto' measures real frame times on this device and steps down when it stutters. */
export type PerfMode = 'auto' | 'high' | 'balanced' | 'light'
export type PerfLevel = 0 | 1 | 2
const MODE_KEY = 'uniflow.perf', AUTO_KEY = 'uniflow.perfAuto'
const parseMode = (v: string | null): PerfMode => (v === 'high' || v === 'balanced' || v === 'light' ? v : 'auto')

let mode: PerfMode = parseMode(safeGet(MODE_KEY))
let autoLevel = Math.min(2, Math.max(0, Number(safeGet(AUTO_KEY)) || 0)) as PerfLevel
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

export const perfLevel = (): PerfLevel => (mode === 'high' ? 0 : mode === 'balanced' ? 1 : mode === 'light' ? 2 : autoLevel)
export function setPerfMode(m: PerfMode) { mode = m; safeSet(MODE_KEY, m); if (m === 'auto') { autoLevel = 0; safeSet(AUTO_KEY, '0') } emit() }
/** Called by the scene when frames come too slowly: one step lighter (remembered for next time). */
export function stepDown() { if (mode !== 'auto' || autoLevel >= 2) return; autoLevel = (autoLevel + 1) as PerfLevel; safeSet(AUTO_KEY, String(autoLevel)); emit() }

/** Frames per second the scene may use, per level, in focus mode and behind the app. 0 = keep the picture still. */
export const fpsFor = (level: PerfLevel, focus: boolean) => (focus ? [60, 30, 24][level] : [25, 12, 0][level])

/** Judges a window of real frame intervals (ms): true when the page itself is stuttering. */
export function isStuttering(gaps: number[]): boolean {
  if (gaps.length < 30) return false
  const sorted = [...gaps].sort((a, b) => a - b), median = sorted[Math.floor(sorted.length / 2)]
  const slow = gaps.filter((g) => g > 34).length / gaps.length
  return median > 22 || slow > 0.15
}

export function usePerf() {
  const level = useSyncExternalStore(subscribe, perfLevel)
  const m = useSyncExternalStore(subscribe, () => mode)
  return { mode: m, level, setMode: setPerfMode }
}
export const subscribePerf = subscribe
