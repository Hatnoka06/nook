import { useCallback, useState } from 'react'
import { safeGet, safeSet } from '@/lib/storage'

export function useSidebarCollapsed(): [boolean, (v: boolean) => void] {
  const [v, setV] = useState(() => safeGet('uniflow.sidebar') === 'true')
  const set = useCallback((n: boolean) => { safeSet('uniflow.sidebar', String(n)); setV(n) }, [])
  return [v, set]
}
