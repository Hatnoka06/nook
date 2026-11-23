import { Music, Plus, Music2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useForms } from '@/app/FormHost'
import { useQuickAdd } from '@/app/QuickAddContext'
import { Button } from '@/components/Button'
import { CardHeader } from '@/components/CardHeader'
import { Card } from '@/components/Card'
import { CheckField, FormError, SelectField, TextField } from '@/components/fields'
import { PageHeader } from '@/components/PageHeader'
import { Segmented } from '@/components/Segmented'
import { Sheet } from '@/components/Sheet'
import { formatDuration } from '@/lib/format'
import type { Lang } from '@/lib/i18n'
import { useCourseMap, useCourses, useSessions, useTasks, useTz } from '@/lib/queries'
import { setFocus } from '@/lib/focusStore'
import { morph } from '@/lib/viewTransition'
import { safeGet, safeSet } from '@/lib/storage'
import { todayISO } from '@/lib/time'
import type { StudyMode } from '@/lib/types'
import { QuoteOfDay } from '@/components/QuoteOfDay'
import { SoundMixer } from './SoundMixer'
import { StudyStats } from './StudyStats'
import { useTimer, type StartArgs } from './useTimer'

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const useFlag = (key: string, def: boolean): [boolean, (v: boolean) => void] => {
  const [v, setV] = useState(() => { const x = safeGet(key); return x === null ? def : x === 'true' })
  return [v, (n) => { safeSet(key, String(n)); setV(n) }]
}
function useDesktop() {
  const [d, setD] = useState(() => matchMedia('(min-width: 1024px)').matches)
  useEffect(() => { const m = matchMedia('(min-width: 1024px)'); const f = () => setD(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f) }, [])
  return d
}

export function StudyPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const tz = useTz()
  const forms = useForms()
  const { setHidden } = useQuickAdd()
  const desktop = useDesktop()
  const tm = useTimer()
  const { data: courses } = useCourses()
  const { data: tasks } = useTasks()
  const courseMap = useCourseMap()
  const sessionsQ = useSessions()
  const [mode, setMode] = useState<StudyMode>('pomodoro')
  const [course, setCourse] = useState(safeGet('uniflow.lastCourse') ?? '')
  const [task, setTask] = useState('')
  const [goal, setGoal] = useState('')
  const [cfg, setCfg] = useState({ focus: '25', break: '5', long: '15', cycles: '1' })
  const [soundsOpen, setSoundsOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [chime, setChime] = useFlag('uniflow.chime', true)
  const [auto, setAuto] = useFlag('uniflow.autoPhase', false)
  const [wake, setWake] = useFlag('uniflow.wake', false)
  const running = tm.row?.status === 'running'
  const inSession = Boolean(tm.row)
  useEffect(() => { setFocus(inSession); return () => setFocus(false) }, [inSession])

  useEffect(() => { document.documentElement.dataset.page = 'study'; return () => { delete document.documentElement.dataset.page } }, [])
  useEffect(() => { setHidden(Boolean(running)); return () => setHidden(false) }, [running, setHidden])
  useEffect(() => {
    if (!running || tm.remaining == null && tm.row?.mode !== 'stopwatch') { document.title = 'Nook'; return }
    document.title = `${clock(tm.remaining ?? tm.elapsed)} · Nook`
    return () => { document.title = 'Nook' }
  }, [running, tm.remaining, tm.elapsed, tm.row?.mode])
  useEffect(() => {
    if (!wake || !running || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    void navigator.wakeLock.request('screen').then((l) => { lock = l }).catch(() => {})
    return () => { void lock?.release() }
  }, [wake, running])

  const startArgs = (): StartArgs => ({ mode, course_id: course || null, task_id: task || null, goal: goal.trim() || null,
    config: mode === 'custom' ? { focus: Number(cfg.focus) * 60, break: Number(cfg.break) * 60, long: Number(cfg.long) * 60, cycles: Math.max(1, Number(cfg.cycles)) } : {} })
  const inFocus = () => Boolean(document.querySelector('.focus-clock')), outOfFocus = () => !inFocus()
  // The clock on the card grows into the full-screen focus clock (and shrinks back when the session ends).
  const onStart = () => (tm.row ? setConfirmReplace(true) : morph(() => { tm.start(startArgs()).catch(() => {}) }, inFocus))
  const r = tm.row
  const shown = r ? (tm.remaining ?? tm.elapsed) : 0
  const sessions = (sessionsQ.data ?? []).filter((s) => !filter || s.course_id === filter).slice().reverse().filter((s) => +new Date() - +new Date(s.started_at) < 8 * 86400000)

  // Rendered on <body>: an animated (transformed) ancestor would otherwise trap position:fixed.
  if (r) return createPortal(
    <section className="focus-scene fixed inset-0 z-20 flex flex-col items-center justify-center gap-6 px-6 pt-16 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.3em] text-text-2">{t(`study.phase.${r.phase}`)}{r.status === 'paused' ? ` · ${t('study.paused')}` : ''}</p>
      <p style={{ viewTransitionName: 'study-clock' }} className="tnum focus-clock text-[22vw] font-semibold leading-none sm:text-[16vw] lg:text-[12rem]" aria-live="off">{clock(shown)}</p>
      {r.goal && <p className="max-w-md text-lg text-text-2">{r.goal}{r.course_id ? ` · ${courseMap.get(r.course_id)?.code ?? ''}` : ''}</p>}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {r.status === 'running' ? <Button onClick={() => void tm.pause()}>{t('study.pause')}</Button> : <Button onClick={() => void tm.resume()}>{r.accumulated_seconds === 0 && r.phase !== 'focus' ? t('study.startBreak') : t('study.resume')}</Button>}
        {r.phase !== 'focus' && <Button variant="secondary" onClick={() => void tm.skipBreak()}>{t('study.skipBreak')}</Button>}
        <Button variant="secondary" onClick={() => morph(() => { void tm.stopAndSave() }, outOfFocus)}>{t('study.stop')}</Button>
        <Button variant="ghost" onClick={() => forms.confirm({ title: t('study.discardTitle'), body: t('study.discardBody'), confirmLabel: t('study.discard'), onConfirm: () => morph(() => { void tm.discard() }, outOfFocus) })}>{t('study.discard')}</Button>
        <Button variant="ghost" aria-label={t('study.soundsOpen')} onClick={() => setSoundsOpen(true)}><Music size={18} strokeWidth={1.5} /></Button>
      </div>
      <div className="quote-quiet mt-6 opacity-90"><QuoteOfDay tz={tz} quiet /></div>
      <Sheet open={soundsOpen} onOpenChange={setSoundsOpen} title={t('study.sounds')}><div className="max-h-[70dvh] overflow-y-auto"><SoundMixer /></div></Sheet>
    </section>,
    document.body,
  )

  return (
    <section>
      <PageHeader title={t('nav.study')} subtitle={t('study.subtitle')} action={<div className="flex gap-2">
        {!desktop && <Button variant="secondary" onClick={() => setSoundsOpen(true)}><Music size={18} strokeWidth={1.5} aria-hidden />{t('study.soundsOpen')}</Button>}
        <Button variant="secondary" onClick={() => forms.open({ kind: 'session' })}><Plus size={18} strokeWidth={1.5} aria-hidden />{t('study.addManual')}</Button></div>} />
      {tm.saveError && <div className="mb-4 flex items-center justify-between gap-3"><FormError>{t('study.saveFailed')}</FormError><Button onClick={tm.retrySave}>{t('study.saveRetry')}</Button></div>}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card glass className="flex flex-col items-center gap-5 py-8 text-center">
          <>
            <Segmented<StudyMode> label={t('nav.study')} value={mode} onChange={setMode} options={(['pomodoro', 'deep_work', 'custom', 'stopwatch'] as const).map((m) => ({ value: m, label: t(`study.modes.${m}`) }))} />
            <p style={{ viewTransitionName: 'study-clock' }} className="tnum text-6xl font-bold md:text-7xl" aria-live="off">{mode === 'stopwatch' ? '00:00' : clock(mode === 'pomodoro' ? 1500 : mode === 'deep_work' ? 3000 : Number(cfg.focus) * 60)}</p>
            <div className="grid w-full max-w-md gap-3 text-left">
              <SelectField label={t('study.course')} value={course} onChange={(e) => setCourse(e.target.value)} options={[{ value: '', label: t('study.noCourse') }, ...(courses ?? []).map((c) => ({ value: c.id, label: `${c.code} ${c.name}` }))]} />
              <TextField label={t('study.goal')} placeholder={t('study.goalPlaceholder')} value={goal} onChange={(e) => setGoal(e.target.value)} />
              <SelectField label={t('study.task')} value={task} onChange={(e) => setTask(e.target.value)} options={[{ value: '', label: t('study.noTask') }, ...(tasks ?? []).filter((x) => x.status === 'todo').map((x) => ({ value: x.id, label: x.title }))]} />
              {mode === 'custom' && <div className="grid grid-cols-2 gap-3">{(['focus', 'break', 'long', 'cycles'] as const).map((k) => <TextField key={k} label={t(k === 'cycles' ? 'study.cycles' : `study.${k}Min`)} type="number" inputMode="numeric" value={cfg[k]} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })} />)}</div>}
            </div>
            <Button className="w-full max-w-md" onClick={onStart}>{t('study.start')}</Button>
          </>
          <div className="flex flex-col items-start gap-1 text-left">
            <CheckField label={t('study.chime')} checked={chime} onChange={(e) => setChime(e.target.checked)} />
            <CheckField label={t('study.autoBreak')} checked={auto} onChange={(e) => setAuto(e.target.checked)} />
            {'wakeLock' in navigator && <CheckField label={t('study.wake')} checked={wake} onChange={(e) => setWake(e.target.checked)} />}
          </div>
        </Card>
        {desktop && <Card className="surface-solid"><CardHeader icon={Music2} title={t('study.sounds')} /><SoundMixer /></Card>}
      </div>
      <div className="mt-4"><StudyStats /></div>
      <Card className="surface-solid mt-4">
        <div className="mb-3 flex items-end justify-between gap-3"><h2 className="font-semibold">{t('study.history')}</h2>
          <div className="w-48"><SelectField label={t('study.course')} value={filter} onChange={(e) => setFilter(e.target.value)} options={[{ value: '', label: t('study.allCourses') }, ...(courses ?? []).map((c) => ({ value: c.id, label: c.code }))]} /></div></div>
        {sessions.length === 0 ? <p className="text-sm text-text-2">{t('study.emptyHistory')}</p> : sessions.map((s) => (
          <button key={s.id} onClick={() => forms.open({ kind: 'session', initial: s })} className="t-ui flex min-h-11 w-full items-center justify-between rounded-input px-2 text-left text-sm hover:bg-surface-2">
            <span className="flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: (s.course_id && courseMap.get(s.course_id)?.color) || 'var(--border)' }} />{todayISO(tz, new Date(s.started_at))} · {s.course_id ? courseMap.get(s.course_id)?.code : t('study.noCourse')}{s.goal ? ` · ${s.goal}` : ''}</span>
            <span className="tnum">{formatDuration(Math.round(s.focus_seconds / 60), lang)}</span>
          </button>))}
      </Card>
      <Sheet open={soundsOpen && !desktop} onOpenChange={setSoundsOpen} title={t('study.sounds')}><div className="max-h-[70dvh] overflow-y-auto"><SoundMixer /></div></Sheet>
      <Sheet open={confirmReplace} onOpenChange={setConfirmReplace} title={t('study.replaceTitle')}>
        <p className="mb-4 text-text-2">{t('study.replaceBody')}</p>
        <Button onClick={async () => { await tm.stopAndSave(); await tm.start(startArgs()); setConfirmReplace(false) }}>{t('study.replace')}</Button>
      </Sheet>
    </section>
  )
}
