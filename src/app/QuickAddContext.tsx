import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

const Ctx = createContext<{ hidden: boolean; setHidden: (v: boolean) => void }>({ hidden: false, setHidden: () => {} })
export const useQuickAdd = () => useContext(Ctx)

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false)
  const value = useMemo(() => ({ hidden, setHidden }), [hidden])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
