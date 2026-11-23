import { useSyncExternalStore } from 'react'
import { safeGet, safeSet } from './storage'

/** The language you are learning (set on the Languages page). Drives the quote and word of the day. */
export type StudyLang = 'zh' | 'es'
const KEY = 'uniflow.lang.deck'
let lang: StudyLang = safeGet(KEY) === 'es' ? 'es' : 'zh'
const listeners = new Set<() => void>()
export function setStudyLang(l: StudyLang) { lang = l; safeSet(KEY, l); listeners.forEach((f) => f()) }
const subscribe = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f) } }
export const useStudyLang = (): [StudyLang, (l: StudyLang) => void] => [useSyncExternalStore(subscribe, () => lang), setStudyLang]
