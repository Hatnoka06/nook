import { ChevronLeft, ChevronRight, PanelLeft, Plus, CheckCircle2, Clock } from 'lucide-react'
import { DateTime } from 'luxon'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForms } from '@/app/FormHost'
import { Button } from '@/components/Button'
import { SelectField } from '@/components/fields'
import { QueryGuard } from '@/components/QueryGuard'
import { Sheet } from '@/components/Sheet'
import { CardHeader } from '@/components/CardHeader'
import { Card } from '@/components/Card'
import { useTable } from '@/lib/data'
import { countdownLabel } from '@/lib/countdownLabel'
import { useProfile } from '@/features/auth/useProfile'
import { useBreaks, useCourseMap, useCourses, useDeadlines, useEvents, useMeetings, useOverrides, useSemesters, useTasks, useTz } from '@/lib/queries'
import { addDaysISO, countdown, dayRangeUtc, startOfWeekISO, todayISO } from '@/lib/time'
import type { Meeting } from '@/lib/types'
import { Agenda, hm, MonthGrid, TimeGrid } from './Grids'
import { buildItems, type CalItem } from './items'

type View = 'day' | 'week' | 'month' | 'agenda'
type Filter = 'all' | 'classes' | 'events' | 'deadlines'

function SidePanel({ items, courses, tz }: { items: CalItem[]; courses: Map<string, unknown>; tz: string }) {
  const { t } = useTranslation()
  void courses
  const now = new Date()
  const dl = items.filter((i) => i.kind === 'deadline').slice(0, 5)
  return (
    <div className="flex flex-col gap-3">
      <Card><CardHeader icon={Clock} title={t('cal.upcoming')} />
        {dl.length === 0 ? <p className="text-sm text-text-2">{t('empty.deadlines')}</p> : dl.map((i) => <p key={i.key} className="flex justify-between gap-2 py-1 text-sm"><span className="truncate">{i.title}</span><span className="tnum shrink-0 text-text-2">{countdownLabel(t, countdown(i.start, now))}</span></p>)}</Card>
      <Card><CardHeader icon={CheckCircle2} title={t('cal.todayTasks')} />
        {items.filter((i) => i.kind === 'task' && i.day === todayISO(tz)).slice(0, 6).map((i) => <p key={i.key} className="py-1 text-sm">{i.title}</p>)}
        {!items.some((i) => i.kind === 'task' && i.day === todayISO(tz)) && <p className="text-sm text-text-2">{t('empty.tasks')}</p>}</Card>
    </div>
  )
}

export function PlannerPage() {
  const { t } = useTranslation()
  const tz = useTz()
  const forms = useForms()
  const { profile } = useProfile()
  const weekStart: 0 | 1 = profile?.week_starts_on ?? 1
  const evQ = useEvents(), ovQ = useOverrides(), mQ = useMeetings(), cQ = useCourses(), sQ = useSemesters(), bQ = useBreaks(), dQ = useDeadlines(), tQ = useTasks()
  const courses = useCourseMap()
  const meetTbl = useTable<Meeting>('course_meetings')
  const today = todayISO(tz)
  const [view, setView] = useState<View>(() => (matchMedia('(min-width: 1024px)').matches ? 'week' : 'agenda'))
  const [anchor, setAnchor] = useState(today)
  const [filter, setFilter] = useState<Filter>('all')
  const [course, setCourse] = useState('')
  const [showTasks, setShowTasks] = useState(false)
  const [sel, setSel] = useState<CalItem | null>(null)
  const [panel, setPanel] = useState(false)

  const days = useMemo(() => {
    if (view === 'day') return [anchor]
    if (view === 'week') { const s = startOfWeekISO(anchor, weekStart); return Array.from({ length: 7 }, (_, i) => addDaysISO(s, i)) }
    if (view === 'agenda') return Array.from({ length: 14 }, (_, i) => addDaysISO(anchor, i))
    const first = DateTime.fromISO(anchor).startOf('month').toISODate()!, s = startOfWeekISO(first, weekStart)
    return Array.from({ length: 42 }, (_, i) => addDaysISO(s, i))
  }, [view, anchor, weekStart])
  const start = dayRangeUtc(days[0], tz).start, end = dayRangeUtc(days[days.length - 1], tz).end
  const all = useMemo(() => buildItems({ events: evQ.data ?? [], overrides: ovQ.data ?? [], meetings: mQ.data ?? [], courses: cQ.data ?? [], semesters: sQ.data ?? [], breaks: bQ.data ?? [], deadlines: dQ.data ?? [], tasks: tQ.data ?? [] }, start, end, tz, showTasks),
    [evQ.data, ovQ.data, mQ.data, cQ.data, sQ.data, bQ.data, dQ.data, tQ.data, start, end, tz, showTasks])
  const items = all.filter((i) => (filter === 'all' || (filter === 'classes' && i.kind === 'class') || (filter === 'events' && i.kind === 'event') || (filter === 'deadlines' && i.kind === 'deadline')) && (!course || i.courseId === course))
  // side panel always shows the near future regardless of the visible range
  const panelItems = useMemo(() => buildItems({ events: [], overrides: [], meetings: [], courses: [], semesters: [], breaks: [], deadlines: (dQ.data ?? []).filter((d) => d.status !== 'submitted' && d.due_at >= new Date().toISOString()), tasks: tQ.data ?? [] },
    new Date(Date.now() - 86400000).toISOString(), new Date(Date.now() + 60 * 86400000).toISOString(), tz, true), [dQ.data, tQ.data, tz])

  const move = (n: number) => {
    const d = DateTime.fromISO(anchor)
    setAnchor((view === 'day' ? d.plus({ days: n }) : view === 'week' ? d.plus({ weeks: n }) : view === 'month' ? d.plus({ months: n }) : d.plus({ days: 14 * n })).toISODate()!)
  }
  const title = view === 'month' ? DateTime.fromISO(anchor).toFormat('LLLL yyyy') : view === 'day' ? DateTime.fromISO(anchor).toFormat('cccc d LLL yyyy') : `${DateTime.fromISO(days[0]).toFormat('d LLL')} – ${DateTime.fromISO(days[days.length - 1]).toFormat('d LLL yyyy')}`
  const ctx = { items, courses, tz, today, breaks: bQ.data ?? [], onOpen: setSel,
    onSlot: (s: string, e: string, allDay: boolean) => forms.open({ kind: 'event', preset: { start: s, end: e, allDay } }) }
  const pills: [Filter, string][] = [['all', 'cal.fAll'], ['classes', 'cal.fClasses'], ['events', 'cal.fEvents'], ['deadlines', 'cal.fDeadlines']]

  const edit = (i: CalItem) => {
    setSel(null)
    if (i.kind === 'deadline') forms.open({ kind: 'deadline', initial: i.ref as never })
    else if (i.kind === 'task') forms.open({ kind: 'task', initial: i.ref as never })
    else if (i.kind === 'class') { const m = i.ref as Meeting; forms.open({ kind: 'meeting', courseId: m.course_id, initial: m }) }
    else forms.open({ kind: 'event', initial: i.ref as never, occurrenceDate: i.recurring ? i.occDate : undefined })
  }
  const empty = !(evQ.data?.length || mQ.data?.length || dQ.data?.length)
  return (
    <section>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="secondary" aria-label={t('cal.prev')} onClick={() => move(-1)}><ChevronLeft size={18} strokeWidth={1.5} /></Button>
          <Button variant="secondary" onClick={() => setAnchor(today)}>{t('cal.today')}</Button>
          <Button variant="secondary" aria-label={t('cal.next')} onClick={() => move(1)}><ChevronRight size={18} strokeWidth={1.5} /></Button>
          <h1 className="tnum ml-2 text-lg font-bold md:text-2xl">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" className="inline-flex gap-1 rounded-full border border-border bg-surface-2 p-1">
            {(['day', 'week', 'month', 'agenda'] as View[]).map((v) => <button key={v} aria-pressed={view === v} onClick={() => setView(v)} className={`t-ui min-h-10 rounded-full px-3 text-sm font-medium ${view === v ? 'bg-ink text-on-ink' : 'text-text-2'}`}>{t(`cal.${v}`)}</button>)}</div>
          <Button className="xl:hidden" variant="secondary" aria-label={t('cal.panel')} onClick={() => setPanel(true)}><PanelLeft size={18} strokeWidth={1.5} /></Button>
          <Button onClick={() => forms.open({ kind: 'event' })}><Plus size={18} strokeWidth={1.5} aria-hidden />{t('cal.add')}</Button>
        </div>
      </header>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        {pills.map(([f, k]) => <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)} className={`t-ui min-h-10 rounded-full border border-border px-4 text-sm ${filter === f ? 'bg-ink text-on-ink' : 'bg-surface'}`}>{t(k)}</button>)}
        <div className="w-40"><SelectField label={t('cal.course')} value={course} onChange={(e) => setCourse(e.target.value)} options={[{ value: '', label: t('common.all') }, ...[...courses.values()].map((c) => ({ value: c.id, label: c.code }))]} /></div>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={showTasks} onChange={(e) => setShowTasks(e.target.checked)} className="h-5 w-5 accent-[var(--primary-strong)]" />{t('cal.showTasks')}</label>
      </div>
      <QueryGuard q={[evQ, mQ, cQ, dQ]} rows={4}>
        {empty && <div className="mb-3 flex items-center justify-between rounded-card border border-border bg-surface p-3 text-sm"><span>{t('cal.empty')}</span><Button onClick={() => forms.open({ kind: 'event' })}>{t('cal.addFirst')}</Button></div>}
        <div className="xl:grid xl:grid-cols-[280px_1fr] xl:gap-4">
          <div className="hidden xl:block"><SidePanel items={panelItems} courses={courses} tz={tz} /></div>
          <div className="page-enter" key={view}>
            {(view === 'day' || view === 'week') && <TimeGrid days={days} ctx={ctx} />}
            {view === 'month' && <MonthGrid days={days} month={DateTime.fromISO(anchor).month} ctx={ctx} onDay={(d) => { setAnchor(d); setView('day') }} />}
            {view === 'agenda' && <Agenda days={days} ctx={ctx} />}
          </div>
        </div>
      </QueryGuard>
      <Sheet open={panel} onOpenChange={setPanel} title={t('cal.panel')}><SidePanel items={panelItems} courses={courses} tz={tz} /></Sheet>
      {sel && (
        <Sheet open onOpenChange={(o) => { if (!o) setSel(null) }} title={sel.title}>
          <div className="mb-4 flex flex-col gap-1 text-sm">
            <p>{sel.kind === 'task' ? sel.day : `${sel.day} · ${sel.allDay ? t('cal.allDay') : `${hm(sel.start, tz)}${sel.kind === 'deadline' ? '' : ` – ${hm(sel.end, tz)}`}`}`}</p>
            {sel.courseId && <p className="text-text-2">{courses.get(sel.courseId)?.code} {courses.get(sel.courseId)?.name}</p>}
            {sel.location && <p className="text-text-2">{sel.location}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => edit(sel)}>{t('common.edit')}</Button>
            {sel.kind === 'class' && <Button variant="secondary" onClick={() => { const m = sel.ref as Meeting; void meetTbl.update.mutateAsync({ id: m.id, patch: { skipped_dates: [...m.skipped_dates, sel.occDate!] } }); setSel(null) }}>{t('cal.skipDate')}</Button>}
            {sel.kind === 'event' && <Button variant="danger" onClick={() => edit(sel)}>{t('common.delete')}</Button>}
          </div>
        </Sheet>
      )}
    </section>
  )
}
