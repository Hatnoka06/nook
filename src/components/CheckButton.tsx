import { useState } from 'react'

/** A round tick button: big enough to hit, and it answers a press with a pop, a filling ring and a check that draws itself.
 *  `onChange` fires after the little animation has played, so a row doesn't vanish before you see your tick. */
export function CheckButton({ checked, onChange, label, size = 26, delay = 420, disabled }: { checked: boolean; onChange: (next: boolean) => void; label: string; size?: number; delay?: number; disabled?: boolean }) {
  const [pending, setPending] = useState<boolean | null>(null)
  const on = pending ?? checked
  const press = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled || pending !== null) return
    const next = !checked
    setPending(next)
    setTimeout(() => { onChange(next); setPending(null) }, next ? delay : 0)
  }
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} disabled={disabled} onClick={press}
      className="check-btn group relative -m-2 flex shrink-0 items-center justify-center rounded-full p-2 disabled:opacity-50" style={{ width: size + 16, height: size + 16 }}>
      <span data-on={on} className="check-ring relative flex items-center justify-center rounded-full" style={{ width: size, height: size }}>
        <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} aria-hidden className="relative">
          <path className="check-mark" d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
        </svg>
      </span>
      {pending === true && <span aria-hidden className="check-burst pointer-events-none absolute inset-0 rounded-full" />}
    </button>
  )
}
