import { useSyncExternalStore } from 'react'
import { safeGet, safeSet } from './storage'
import { BG_KEY, REDUCE_KEY, applyAppearance, osPrefersReducedTransparency, parseBackground, parseReduceEffects, type BackgroundId } from './appearance'

type State = { bg: BackgroundId; reduce: boolean }
let state: State = { bg: parseBackground(safeGet(BG_KEY)), reduce: parseReduceEffects(safeGet(REDUCE_KEY), osPrefersReducedTransparency()) }
const listeners = new Set<() => void>()
applyAppearance(state)

function update(next: State) {
  state = next
  applyAppearance(state)
  listeners.forEach((l) => l())
}
const setBg = (bg: BackgroundId) => { safeSet(BG_KEY, bg); update({ ...state, bg }) }
const setReduce = (reduce: boolean) => { safeSet(REDUCE_KEY, String(reduce)); update({ ...state, reduce }) }
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

/** Shared store so Settings and the layout stay in sync. */
export function useAppearance() {
  const s = useSyncExternalStore(subscribe, () => state)
  return { ...s, setBg, setReduce }
}
