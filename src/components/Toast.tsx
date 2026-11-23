import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from './Button'

type Opts = { actionLabel?: string; onAction?: () => void; durationMs?: number }
type Item = Opts & { id: number; msg: string }
const Ctx = createContext<{ show: (msg: string, opts?: Opts) => void }>({ show: () => {} })
export const useToast = () => useContext(Ctx)

let seq = 0
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const dismiss = useCallback((id: number) => setItems((s) => s.filter((i) => i.id !== id)), [])
  const show = useCallback((msg: string, opts: Opts = {}) => {
    const id = ++seq
    setItems((s) => [...s, { id, msg, ...opts }])
    setTimeout(() => dismiss(id), opts.durationMs ?? (opts.actionLabel ? 8000 : 4000))
  }, [dismiss])
  const value = useMemo(() => ({ show }), [show])
  return (
    <Ctx.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="toast-stack pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
        {items.map((i) => (
          <div key={i.id} className="toast-in glass pointer-events-auto flex items-center gap-3 rounded-full border py-2 pl-3 pr-2 text-sm shadow-lg">
            <CheckCircle2 size={18} strokeWidth={1.6} className="shrink-0 text-primary-strong" aria-hidden /><span className="pr-2">{i.msg}</span>
            {i.actionLabel && (
              <Button variant="ghost" onClick={() => { i.onAction?.(); dismiss(i.id) }}>{i.actionLabel}</Button>
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
