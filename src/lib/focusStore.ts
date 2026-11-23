import { useSyncExternalStore } from 'react'

/** Focus mode = a study session is on screen: chrome collapses, only the scene and the clock remain. */
let focus = false
const listeners = new Set<() => void>()
export function setFocus(v: boolean) {
  if (focus === v) return
  focus = v
  if (typeof document !== 'undefined') document.documentElement.dataset.focus = String(v)
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const useFocus = () => useSyncExternalStore(subscribe, () => focus)
