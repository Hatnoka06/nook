import { useSyncExternalStore } from 'react'
import { safeGet, safeSet } from './storage'
import { THEME_KEY, applyTheme, parseThemePref, type ThemePref } from './theme'

let pref: ThemePref = parseThemePref(safeGet(THEME_KEY))
const listeners = new Set<() => void>()
function set(p: ThemePref) { pref = p; safeSet(THEME_KEY, p); applyTheme(p); listeners.forEach((l) => l()) }
if (typeof matchMedia === 'function') {
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (pref === 'system') applyTheme('system') })
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

export const setThemePref = set
export function useTheme() {
  const p = useSyncExternalStore(subscribe, () => pref)
  return { pref: p, setPref: set }
}
