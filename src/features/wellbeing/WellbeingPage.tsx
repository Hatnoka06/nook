import { ChevronLeft, ChevronRight, Cloud, CloudRain, CloudSun, Minus, Moon, Plus, Sparkles, Sun, X, Zap, Smile, TrendingUp } from 'lucide-react'
import { DateTime } from 'luxon'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/Button'
import { CardHeader } from '@/components/CardHeader'
import { Card } from '@/components/Card'
import { MiniBars } from '@/components/MiniBars'
import { PageHeader } from '@/components/PageHeader'
import { QueryGuard } from '@/components/QueryGuard'
import { TextArea, TextField } from '@/components/fields'
import { useProfile } from '@/features/auth/useProfile'
import { useSession } from '@/features/auth/AuthProvider'
import { useTable } from '@/lib/data'
import { useCheckins, useHabitLogs, useHabits, useTz } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import { addDaysISO, todayISO } from '@/lib/time'
import type { Habit } from '@/lib/types'
import { canEdit, checkinStreak, MOOD_COLORS, waterRatio } from '@/lib/wellbeing'

const MOODS = [CloudRain, Cloud, CloudSun, Sun, Sparkles]

function Glass({ ratio }: { ratio: number }) {
  const y = (1 - ratio) * 138
  return (
    <svg viewBox="0 0 120 170" className="w-36 shrink-0" role="img" aria-label={`${Math.round(ratio * 100)}%`}>
      <defs><clipPath id="wb-glass"><path d="M16 8h88l-9 140a12 12 0 0 1-12 12H37a12 12 0 0 1-12-12Z" /></clipPath></defs>
      <g clipPath="url(#wb-glass)">
        <rect width="120" height="170" fill="var(--surface-2)" />
        <g style={{ transform: `translateY(${y}px)`, transition: 'transform 1100ms cubic-bezier(.2,.8,.2,1)' }}>
          <g className="art-wave" opacity="0.55"><path d="M-120 22q15-12 30 0t30 0 30 0 30 0 30 0 30 0 30 0 30 0 30 0V200H-120Z" fill="var(--info)" /></g>
          <g className="art-wave-2"><path d="M-120 28q15-10 30 0t30 0 30 0 30 0 30 0 30 0 30 0 30 0 30 0V200H-120Z" fill="var(--primary)" opacity="0.7" /></g>
        </g>
      </g>
      <path d="M16 8h88l-9 140a12 12 0 0 1-12 12H37a12 12 0 0 1-12-12Z" fill="none" stroke="var(--text-2)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export function WellbeingPage() {
  const { t } = useTranslation()
  const tz = useTz()
  const uid = useSession()?.user.id
  const qc = useQueryClient()
  const { profile, update } = useProfile()
  const ciQ = useCheckins(), hQ = useHabits(), lQ = useHabitLogs()
  const habitTbl = useTable<Habit>('habits')
  const today = todayISO(tz)
  const [date, setDate] = useState(today)
  const [draft, setDraft] = useState<Record<string, unknown>>({})
  const [saveErr, setSaveErr] = useState(false)
  const [newHabit, setNewHabit] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const rec = (ciQ.data ?? []).find((c) => c.date === date)
  const cur = { mood: rec?.mood ?? null, energy: rec?.energy ?? null, sleep_hours: rec?.sleep_hours ?? null, water_ml: rec?.water_ml ?? 0, note: rec?.note ?? '', ...draft } as { mood: number | null; energy: number | null; sleep_hours: number | null; water_ml: number; note: string }
  const editable = canEdit(date, today)
  const waterGoal = profile?.water_goal_ml ?? 2000, sleepGoal = profile?.sleep_goal_hours ?? 8
  useEffect(() => { setDraft({}) }, [date])
  useEffect(() => () => clearTimeout(timer.current), [])

  const save = (next: typeof cur) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const { error } = await supabase.from('daily_checkins').upsert({ user_id: uid, date, mood: next.mood, energy: next.energy, sleep_hours: next.sleep_hours, water_ml: next.water_ml, note: next.note?.slice(0, 280) || null }, { onConflict: 'user_id,date' })
      setSaveErr(Boolean(error))
      if (!error) { await qc.invalidateQueries({ queryKey: ['daily_checkins'] }); setDraft({}) }
    }, 400)
  }
  const change = (patch: Partial<typeof cur>) => { const next = { ...cur, ...patch }; setDraft((d) => ({ ...d, ...patch })); save(next) }

  const dates = (ciQ.data ?? []).map((c) => c.date)
  const streak = checkinStreak(dates, today)
  const grid = useMemo(() => Array.from({ length: 30 }, (_, i) => addDaysISO(today, i - 29)), [today])
  const byDate = new Map((ciQ.data ?? []).map((c) => [c.date, c]))
  const activeHabits = (hQ.data ?? []).filter((h) => !h.archived)
  const logOf = (id: string) => (lQ.data ?? []).find((l) => l.habit_id === id && l.date === date)
  const toggleHabit = async (h: Habit) => {
    await supabase.from('habit_logs').upsert({ user_id: uid, habit_id: h.id, date, done: !(logOf(h.id)?.done) }, { onConflict: 'habit_id,date' })
    await qc.invalidateQueries({ queryKey: ['habit_logs'] })
  }
  const dt = DateTime.fromISO(date)
  const sleepBars = Array.from({ length: 14 }, (_, i) => addDaysISO(today, i - 13)).map((d) => ({ d, v: byDate.get(d)?.sleep_hours ?? 0 }))
  const waterBars = Array.from({ length: 7 }, (_, i) => addDaysISO(today, i - 6)).map((d) => ({ d, v: byDate.get(d)?.water_ml ?? 0 }))
  return (
    <section>
      <PageHeader title={t('wb.title')} subtitle={t('wb.subtitle')} action={<p className="tnum rounded-full bg-surface-2 px-4 py-2 text-sm">{t('wb.streak', { count: streak })}</p>} />
      <QueryGuard q={[ciQ, hQ, lQ]} rows={3}>
        <div className="mb-3 flex items-center justify-center gap-2">
          <Button variant="ghost" aria-label={t('wb.prevDay')} onClick={() => setDate(addDaysISO(date, -1))}><ChevronLeft size={18} strokeWidth={1.5} /></Button>
          <p className="min-w-44 text-center font-medium">{dt.toFormat('cccc d LLL')}{date === today ? ` · ${t('common.today')}` : ''}</p>
          <Button variant="ghost" aria-label={t('wb.nextDay')} disabled={date >= today} onClick={() => setDate(addDaysISO(date, 1))}><ChevronRight size={18} strokeWidth={1.5} /></Button>
        </div>
        {!editable && <p className="mb-3 text-center text-sm text-text-2">{t('wb.readOnly')}</p>}
        {saveErr && <p role="alert" className="mb-3 text-center text-sm">{t('wb.saveFailed')}</p>}
        <div className="stagger grid gap-4 md:grid-cols-2">
          <Card glass className="flex items-center gap-5">
            <Glass ratio={waterRatio(cur.water_ml, waterGoal)} />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">{t('wb.water')}</h2>
              <p className="tnum text-3xl font-bold">{cur.water_ml}<span className="text-base font-normal text-text-2"> {t('wb.of', { goal: waterGoal })}</span></p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[150, 250, 500].map((ml) => <Button key={ml} variant="secondary" disabled={!editable} onClick={() => change({ water_ml: cur.water_ml + ml })}>+{ml}</Button>)}
                <Button variant="ghost" aria-label="-250" disabled={!editable || cur.water_ml <= 0} onClick={() => change({ water_ml: Math.max(0, cur.water_ml - 250) })}><Minus size={16} strokeWidth={1.5} /></Button>
              </div>
            </div>
          </Card>
          <Card glass>
            <CardHeader icon={Moon} title={t('wb.sleep')} tint="#8B83C8" />
            <div className="flex items-center gap-3">
              <Button variant="secondary" aria-label="-0.5" disabled={!editable} onClick={() => change({ sleep_hours: Math.max(0, (cur.sleep_hours ?? sleepGoal) - 0.5) })}><Minus size={16} strokeWidth={1.5} /></Button>
              <p className="tnum min-w-24 text-center text-4xl font-bold">{cur.sleep_hours ?? '–'}<span className="text-base font-normal text-text-2"> {t('wb.hours', { h: '' }).trim()}</span></p>
              <Button variant="secondary" aria-label="+0.5" disabled={!editable} onClick={() => change({ sleep_hours: Math.min(14, (cur.sleep_hours ?? sleepGoal - 0.5) + 0.5) })}><Plus size={16} strokeWidth={1.5} /></Button>
            </div>
            <div className="my-3 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary-strong transition-[width] duration-700" style={{ width: `${Math.min(100, ((cur.sleep_hours ?? 0) / sleepGoal) * 100)}%` }} /></div>
            <MiniBars data={sleepBars} max={sleepGoal} label={t('wb.sleepWeek')} unit="h" highlight={date} />
          </Card>
          <Card glass>
            <CardHeader icon={Smile} title={t('wb.mood')} />
            <div className="flex justify-between gap-1" role="radiogroup" aria-label={t('wb.mood')}>
              {MOODS.map((Icon, i) => { const n = i + 1, on = cur.mood === n
                return <button key={n} role="radio" aria-checked={on} aria-label={t(`wb.moods.${n}`)} disabled={!editable} onClick={() => change({ mood: on ? null : n })}
                  className="t-ui flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-card text-xs" style={{ background: on ? MOOD_COLORS[i] : undefined, color: on ? '#1B2638' : undefined, transform: on ? 'scale(1.06)' : undefined }}>
                  <Icon size={22} strokeWidth={1.5} aria-hidden />{t(`wb.moods.${n}`)}</button> })}
            </div>
            <h2 className="mb-2 mt-4 font-semibold">{t('wb.energy')}</h2>
            <div className="flex gap-1" role="radiogroup" aria-label={t('wb.energy')}>
              {[1, 2, 3, 4, 5].map((n) => <button key={n} role="radio" aria-checked={cur.energy === n} aria-label={String(n)} disabled={!editable} onClick={() => change({ energy: cur.energy === n ? null : n })} className="t-ui flex min-h-11 flex-1 items-center justify-center rounded-full border border-border" style={{ background: (cur.energy ?? 0) >= n ? 'color-mix(in srgb, var(--primary) 35%, transparent)' : undefined }}><Zap size={16} strokeWidth={1.5} aria-hidden /></button>)}
            </div>
          </Card>
          <Card glass>
            <TextArea label={t('wb.note')} placeholder={t('wb.notePh')} maxLength={280} disabled={!editable} value={cur.note} onChange={(e) => change({ note: e.target.value })} />
            <h2 className="mb-1 mt-4 font-semibold">{t('wb.habits')}</h2>
            <ul>{activeHabits.map((h) => { const done = logOf(h.id)?.done
              return <li key={h.id} className="flex min-h-11 items-center gap-3">
                <button role="checkbox" aria-checked={Boolean(done)} aria-label={h.name} disabled={!editable} onClick={() => void toggleHabit(h)} className="t-ui flex h-7 w-7 items-center justify-center rounded-full border border-border" style={{ background: done ? 'var(--primary-strong)' : undefined, color: done ? 'var(--on-primary)' : undefined }}>{done ? '✓' : ''}</button>
                <span className="flex-1 text-sm">{h.name}</span>
                <button aria-label={t('wb.archive')} className="min-h-11 min-w-11 text-text-2" onClick={() => void habitTbl.update.mutateAsync({ id: h.id, patch: { archived: true } })}><X size={14} strokeWidth={1.5} className="mx-auto" /></button></li> })}</ul>
            {activeHabits.length < 5 ? (
              <form className="mt-1 flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (newHabit.trim()) { void habitTbl.insert.mutateAsync({ name: newHabit.trim(), sort_order: activeHabits.length } as Partial<Habit>); setNewHabit('') } }}>
                <div className="flex-1"><TextField label={t('wb.habitName')} value={newHabit} onChange={(e) => setNewHabit(e.target.value)} /></div><Button type="submit" variant="secondary">{t('wb.addHabit')}</Button></form>
            ) : <p className="text-xs text-text-2">{t('wb.maxHabits')}</p>}
          </Card>
          <Card glass className="md:col-span-2">
            <CardHeader icon={TrendingUp} title={t('wb.last30')} />
            <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
              {grid.map((d) => { const c = byDate.get(d)
                return <button key={d} onClick={() => setDate(d)} aria-label={`${d}${c?.mood ? ` ${t(`wb.moods.${c.mood}`)}` : ''}`} title={c?.note ?? d}
                  className="t-ui aspect-square rounded-[10px] border border-border" style={{ background: c?.mood ? MOOD_COLORS[c.mood - 1] : c ? 'var(--surface-2)' : 'transparent', outline: d === date ? '2px solid var(--primary-strong)' : undefined, outlineOffset: 1 }} /> })}
            </div>
            {byDate.get(date)?.note && <p className="mt-3 text-sm text-text-2">“{byDate.get(date)!.note}”</p>}
            <h2 className="mb-2 mt-4 text-sm font-semibold">{t('wb.waterWeek')}</h2><MiniBars data={waterBars} max={waterGoal} label={t('wb.waterWeek')} unit="ml" highlight={date} />
            <details className="mt-3"><summary className="min-h-11 cursor-pointer py-2 text-sm">{t('wb.goals')}</summary>
              <div className="grid grid-cols-2 gap-3">
                <TextField label={t('wb.waterGoal')} type="number" inputMode="numeric" defaultValue={waterGoal} onBlur={(e) => { const n = Number(e.target.value); if (n >= 0 && n <= 10000) void update({ water_goal_ml: n }) }} />
                <TextField label={t('wb.sleepGoal')} type="number" inputMode="decimal" defaultValue={sleepGoal} onBlur={(e) => { const n = Number(e.target.value); if (n >= 0 && n <= 14) void update({ sleep_goal_hours: n }) }} />
              </div></details>
          </Card>
        </div>
      </QueryGuard>
    </section>
  )
}
