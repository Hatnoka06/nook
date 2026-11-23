import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { fromInputLocal } from '@/lib/time'
import type { Course, SemesterBreak } from '@/lib/types'
import { Chip, chipStyle } from './chips'
import type { CalItem } from './items'

const START_H = 6, END_H = 22, HOUR_PX = 48
export const hm = (iso: string, tz: string) => DateTime.fromISO(iso, { zone: 'utc' }).setZone(tz).toFormat('HH:mm')
const mins = (iso: string, tz: string) => { const d = DateTime.fromISO(iso, { zone: 'utc' }).setZone(tz); return d.hour * 60 + d.minute }

type Ctx = { items: CalItem[]; courses: Map<string, Course>; tz: string; today: string; breaks: SemesterBreak[]; onOpen: (i: CalItem) => void; onSlot: (startUtc: string, endUtc: string, allDay: boolean) => void }
const breakOn = (day: string, breaks: SemesterBreak[]) => breaks.find((b) => day >= b.start_date && day <= b.end_date)
const HATCH = { backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in srgb, var(--text-2) 12%, transparent) 6px 8px)' }

function lanes(list: CalItem[], tz: string): Map<string, { lane: number; of: number }> {
  const out = new Map<string, { lane: number; of: number }>(); const ends: number[] = []
  for (const i of list) {
    const s = mins(i.start, tz), e = Math.max(s + 30, mins(i.end, tz))
    let l = ends.findIndex((x) => x <= s); if (l < 0) { l = ends.length; ends.push(0) }
    ends[l] = e; out.set(i.key, { lane: l, of: 0 })
  }
  for (const v of out.values()) v.of = Math.max(1, ends.length)
  return out
}

export function TimeGrid({ days, ctx }: { days: string[]; ctx: Ctx }) {
  const { t } = useTranslation()
  const { items, courses, tz, today, breaks, onOpen, onSlot } = ctx
  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i)
  const cols = days.length
  return (
    <div className="surface-solid overflow-x-auto rounded-card border border-border">
      <div style={{ minWidth: cols > 1 ? 640 : 0 }}>
        <div className="grid border-b border-border" style={{ gridTemplateColumns: `48px repeat(${cols}, 1fr)` }}>
          <div />
          {days.map((d) => { const br = breakOn(d, breaks); const dt = DateTime.fromISO(d)
            return (
              <div key={d} className="border-l border-border p-1 text-center" style={br ? HATCH : undefined}>
                <p className="text-xs text-text-2">{dt.toFormat('ccc')}</p>
                <p className={`tnum mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${d === today ? 'bg-ink text-on-ink' : ''}`}>{dt.day}</p>
                {br && <p className="truncate text-[10px] text-text-2">{t('cal.breakLabel', { name: br.name })}</p>}
                {items.filter((i) => i.allDay && i.day === d).map((i) => <Chip key={i.key} item={i} course={i.courseId ? courses.get(i.courseId) : undefined} onClick={() => onOpen(i)} />)}
              </div>) })}
        </div>
        <div className="relative grid" style={{ gridTemplateColumns: `48px repeat(${cols}, 1fr)`, height: (END_H - START_H) * HOUR_PX }}>
          <div>{hours.map((h) => <div key={h} className="tnum pr-1 text-right text-[10px] text-text-2" style={{ height: HOUR_PX }}>{String(h).padStart(2, '0')}:00</div>)}</div>
          {days.map((d) => {
            const list = items.filter((i) => !i.allDay && i.day === d); const L = lanes(list, tz)
            return (
              <div key={d} className="relative border-l border-border" style={breakOn(d, breaks) ? HATCH : undefined}
                onClick={(e) => { if (e.target !== e.currentTarget) return; const y = e.clientY - e.currentTarget.getBoundingClientRect().top; const m = Math.floor(((y / HOUR_PX) * 60) / 30) * 30 + START_H * 60
                  const s = fromInputLocal(`${d}T${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`, tz); onSlot(s, new Date(+new Date(s) + 3600000).toISOString(), false) }}>
                {hours.map((h) => <div key={h} className="pointer-events-none border-t border-border/60" style={{ height: HOUR_PX }} />)}
                {list.map((i) => { const s = mins(i.start, tz), e = Math.max(s + 30, mins(i.end, tz)); const p = L.get(i.key)!
                  return <div key={i.key} className="absolute px-px" style={{ top: ((s - START_H * 60) / 60) * HOUR_PX, height: ((e - s) / 60) * HOUR_PX - 2, left: `${(p.lane / p.of) * 100}%`, width: `${100 / p.of}%` }}>
                    <button onClick={() => onOpen(i)} style={chipStyle(i, i.courseId ? courses.get(i.courseId) : undefined)} className="t-ui h-full w-full overflow-hidden rounded-chip px-1.5 py-0.5 text-left text-xs hover:brightness-95">
                      <span className="tnum block text-text-2">{hm(i.start, tz)}{i.kind === 'deadline' ? ' !' : ''}</span><span className="block truncate font-medium">{i.title}</span></button></div> })}
              </div>)
          })}
        </div>
      </div>
    </div>
  )
}

export function MonthGrid({ days, month, ctx, onDay }: { days: string[]; month: number; ctx: Ctx; onDay: (d: string) => void }) {
  const { t } = useTranslation()
  const { items, courses, today, breaks, onOpen } = ctx
  return (
    <div className="surface-solid grid grid-cols-7 overflow-hidden rounded-card border border-border">
      {days.slice(0, 7).map((d) => <p key={d} className="border-b border-border p-1 text-center text-xs text-text-2">{DateTime.fromISO(d).toFormat('ccc')}</p>)}
      {days.map((d) => { const dt = DateTime.fromISO(d), list = items.filter((i) => i.day === d), br = breakOn(d, breaks)
        return (
          <div key={d} className={`min-h-24 border-b border-r border-border p-1 ${dt.month === month ? '' : 'opacity-50'}`} style={br ? HATCH : undefined} title={br ? br.name : undefined}>
            <button onClick={() => onDay(d)} aria-label={d} className={`tnum flex h-7 min-w-7 items-center justify-center rounded-full text-xs ${d === today ? 'bg-ink text-on-ink' : ''}`}>{dt.day}</button>
            <div className="mt-1 flex flex-col gap-0.5">
              {list.slice(0, 3).map((i) => <Chip key={i.key} item={i} course={i.courseId ? courses.get(i.courseId) : undefined} onClick={() => onOpen(i)} />)}
              {list.length > 3 && <button onClick={() => onDay(d)} className="text-left text-[11px] text-text-2">{t('cal.more', { n: list.length - 3 })}</button>}
            </div>
          </div>) })}
    </div>
  )
}

export function Agenda({ days, ctx }: { days: string[]; ctx: Ctx }) {
  const { t } = useTranslation()
  const { items, courses, tz, today, onOpen } = ctx
  const any = items.length > 0
  if (!any) return <p className="py-10 text-center text-text-2">{t('cal.agendaEmpty')}</p>
  return (
    <div className="stagger flex flex-col gap-3">
      {days.map((d) => { const list = items.filter((i) => i.day === d); if (!list.length) return null
        return (
          <div key={d} className="surface-solid rounded-card border border-border p-3">
            <p className={`mb-2 text-sm font-semibold ${d === today ? '' : 'text-text-2'}`}>{DateTime.fromISO(d).toFormat('cccc d LLL')}{d === today ? ` · ${t('common.today')}` : ''}</p>
            <div className="flex flex-col gap-1">{list.map((i) => <Chip key={i.key} item={i} course={i.courseId ? courses.get(i.courseId) : undefined} onClick={() => onOpen(i)} time={i.allDay ? undefined : hm(i.start, tz)} className="min-h-11 text-sm" />)}</div>
          </div>) })}
    </div>
  )
}
