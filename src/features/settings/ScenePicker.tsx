import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BackgroundId } from '@/lib/appearance'
import type { Lang } from '@/lib/i18n'
import { SCENES, SCENE_IDS, type Scene } from '@/lib/scene/scenes'

/** Tiny painted thumbnail of a scene: its sky, three ranges in the scene's shape, water and a sun, moon or planet. */
function Thumb({ s, dark }: { s: Scene; dark: boolean }) {
  const p = s.dark && dark ? s.dark : s.light, sp = s.spec
  const range = (base: number, amp: number, seed: number) => {
    const pts: string[] = []
    for (let x = 0; x <= 120; x += 6) {
      const u = x / 120
      const y = sp.terrain === 'ridged' ? base - amp * Math.abs(Math.sin(u * 7 + seed) * Math.cos(u * 3 + seed * 2))
        : sp.terrain === 'dunes' ? base - amp * Math.max(0, Math.sin(u * 5 + seed)) ** 1.6
        : sp.terrain === 'cone' && seed === 1 ? base - amp * 2.2 * Math.max(0, 1 - Math.abs(u - 0.42) / 0.3)
        : base - amp * (0.5 + 0.5 * Math.sin(u * 4 + seed)) * (sp.terrain === 'craters' ? 0.4 : 0.8)
      pts.push(`${x},${y.toFixed(1)}`)
    }
    return `M0,80 L${pts.join(' L')} L120,80 Z`
  }
  const waterY = sp.water === 'sea' ? 52 : 62
  return (
    <svg viewBox="0 0 120 80" className="block h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id={`sky-${s.id}${dark}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.skyTop} /><stop offset="1" stopColor={p.sky} /></linearGradient></defs>
      <rect width="120" height="80" fill={`url(#sky-${s.id}${dark})`} />
      {(dark || sp.space) && [[12, 8], [30, 18], [52, 6], [70, 14], [96, 9], [20, 26], [108, 22]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="0.7" fill="#fff" opacity="0.8" />)}
      {sp.space ? <g><ellipse cx="88" cy="20" rx="17" ry="4" fill="none" stroke={p.glow} strokeWidth="1.4" opacity="0.7" transform="rotate(-18 88 20)" /><circle cx="88" cy="20" r="8" fill={p.leaf2} /></g>
        : <circle cx="92" cy="17" r="6" fill={p.glow} opacity="0.95" />}
      {dark && sp.aurora > 1 && <path d="M0,24 C30,10 60,30 120,14 L120,22 C60,38 30,18 0,32 Z" fill={p.leaf} opacity="0.35" />}
      <path d={range(42, 16, 0)} fill={p.m1} /><path d={range(52, 14, 1)} fill={p.m2} />
      {sp.snow > 0 && sp.terrain === 'cone' && <path d="M43,18 L52,18 L58,28 L37,28 Z" fill={p.snow} opacity="0.9" />}
      <path d={range(62, 10, 2)} fill={p.m3} />
      {sp.water !== 'none' && <rect y={waterY} width="120" height={80 - waterY} fill={p.lake} />}
      {sp.water === 'none' && <path d={range(70, 5, 3)} fill={p.m4} />}
      {sp.water === 'sea' && <path d="M0,80 L0,68 Q18,66 40,80 Z" fill={p.m4} />}
      {sp.water === 'lake' && <rect y="74" width="120" height="6" fill={p.m4} />}
      {sp.trees !== 'none' && sp.water !== 'sea' && [8, 16, 104, 112].map((x, i) => sp.trees === 'pine' || sp.trees === 'cypress'
        ? <path key={x} d={`M${x},${76 - (i % 2) * 2} l3,-${sp.trees === 'cypress' ? 14 : 10} l3,${sp.trees === 'cypress' ? 14 : 10} Z`} fill={p.tree} />
        : <circle key={x} cx={x + 3} cy={70 - (i % 2) * 2} r="4" fill={i % 2 ? p.leaf : p.tree} />)}
    </svg>
  )
}

export function ScenePicker({ value, onChange }: { value: BackgroundId; onChange: (b: BackgroundId) => void }) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language === 'vi' ? 'vi' : 'en') as Lang
  const dark = document.documentElement.dataset.theme === 'dark'
  const card = (id: BackgroundId, label: string, thumb: React.ReactNode) => {
    const on = value === id
    return (
      <button key={id} type="button" aria-pressed={on} onClick={() => onChange(id)}
        className={`lift group relative overflow-hidden rounded-card border-2 text-left ${on ? 'border-primary-strong' : 'border-transparent hover:border-border'}`}>
        <div className="aspect-[3/2] overflow-hidden rounded-[14px]">{thumb}</div>
        <span className="flex items-center justify-between gap-1 px-1.5 py-1.5 text-xs font-medium">{label}{on && <Check size={14} strokeWidth={2} className="text-primary-strong" aria-hidden />}</span>
      </button>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-2 py-3 sm:grid-cols-3 lg:grid-cols-4">
      {SCENE_IDS.map((id) => card(id, SCENES[id].name[lang], <Thumb s={SCENES[id]} dark={dark} />))}
      {card('plain', t('settings.bgPlain'), <div className="h-full w-full bg-surface-2" />)}
    </div>
  )
}
