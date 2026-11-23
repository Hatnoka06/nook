import type { LucideIcon } from 'lucide-react'

/** Animated progress ring with an icon and a value in the middle. */
export function Ring({ value, max, label, display, icon: Icon, color = 'var(--primary-strong)', size = 84 }:
  { value: number; max: number; label: string; display: string; icon: LucideIcon; color?: string; size?: number }) {
  const r = 34, c = 2 * Math.PI * r, p = max > 0 ? Math.min(1, value / max) : 0
  return (
    <figure className="flex flex-col items-center gap-1.5" aria-label={`${label}: ${display}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="42" cy="42" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="7" />
          <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={c}
            strokeDashoffset={c * (1 - p)} className="ring-progress" style={{ filter: p >= 1 ? `drop-shadow(0 0 6px ${color})` : undefined }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={18} strokeWidth={1.6} aria-hidden style={{ color }} />
          <span className="tnum mt-0.5 text-[13px] font-semibold leading-none">{display}</span>
        </div>
      </div>
      <figcaption className="text-xs font-medium text-text-2">{label}</figcaption>
    </figure>
  )
}
