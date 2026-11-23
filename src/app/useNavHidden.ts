import { useSyncExternalStore } from 'react'
import { safeGet, safeSet } from '@/lib/storage'

/** Menu tucked away into a small floating bubble (remembered per device; shared so Settings can switch it back). */
let hidden = safeGet('uniflow.navHidden') === 'true'
const listeners = new Set<() => void>()
const set = (n: boolean) => { hidden = n; safeSet('uniflow.navHidden', String(n)); listeners.forEach((l) => l()) }
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export function useNavHidden(): [boolean, (v: boolean) => void] {
  return [useSyncExternalStore(subscribe, () => hidden), set]
}
