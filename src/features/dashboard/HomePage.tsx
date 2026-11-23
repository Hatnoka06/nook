import { BookOpenCheck, CalendarDays, CheckCircle2, Clock, Droplets, Flame, ListChecks, Quote, Timer } from 'lucide-react'
import { CheckButton } from '@/components/CheckButton'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForms } from '@/app/FormHost'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { CardHeader } from '@/components/CardHeader'
import { EmptyState } from '@/components/EmptyState'
import { Ring } from '@/components/Ring'
import { QuoteOfDay } from '@/components/QuoteOfDay'
import { WeatherCard } from '@/components/WeatherCard'
import { WordOfDayCard } from '@/features/languages/WordOfDayCard'
import { QueryGuard } from '@/components/QueryGuard'
import { useToast } from '@/components/Toast'
import { useProfile } from '@/features/auth/useProfile'
import { buildItems } from '@/features/calendar/items'
import { hm } from '@/features/calendar/Grids'
import { chipStyle } from '@/features/calendar/chips'
import { sortTasks } from '@/features/tasks/logic'
import { LEVEL_STYLE } from '@/features/deadlines/DeadlinesPage'
import { countdownLabel } from '@/lib/countdownLabel'
import { useTable } from '@/lib/data'
import { formatDate } from '@/lib/format'
import type { Lang } from '@/lib/i18n'
import { useToday } from '@/lib/daily'
import { useBreaks, useCheckins, useCourseMap, useCourses, useCurrentSemester, useDeadlines, useEvents, useMeetings, useOverrides, useSemesters, useSessions, useTasks, useTz, useVocab } from '@/lib/queries'
import { countdown, dayRangeUtc, semesterWeek } from '@/lib/time'
import type { Task } from '@/lib/types'
import { useStudyLang } from '@/lib/studyLang'

export function HomePage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const tz = useTz()
  const nav = useNavigate()
  const forms = useForms()
  const { show } = useToast()
  const { profile } = useProfile()
  const vis = profile?.widget_visibility ?? {}
  const evQ = useEvents(), ovQ = useOverrides(), mQ = useMeetings(), cQ = useCourses(), sQ = useSemesters(), bQ = useBreaks(), dQ = useDeadlines(), tQ = useTasks(), ssQ = useSessions(), ckQ = useCheckins()
  const vQ = useVocab()
  const [studyLang] = useStudyLang()
  const qs = [evQ, ovQ, mQ, cQ, sQ, bQ, dQ, tQ, ssQ, ckQ]
  const courses = useCourseMap()
  const sem = useCurrentSemester()
  const taskTbl = useTable<Task>('tasks')
  const now = new Date()
  const today = useToday(tz)
  const range = dayRangeUtc(today, tz)
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: tz }).format(now))
  const greeting = hour < 12 ? 'greetingMorning' : hour < 18 ? 'greetingAfternoon' : 'greetingEvening'
  const w = sem ? semesterWeek(sem, bQ.data ?? [], today) : null
  const daysLeft = sem ? Math.max(0, Math.round((+new Date(sem.end_date) - +new Date(today)) / 86400000)) : 0

  const schedule = buildItems({ events: evQ.data ?? [], overrides: ovQ.data ?? [], meetings: mQ.data ?? [], courses: cQ.data ?? [], semesters: sQ.data ?? [], breaks: bQ.data ?? [], deadlines: [], tasks: [] }, range.start, range.end, tz, false)
  const nextIdx = schedule.findIndex((i) => i.end > now.toISOString())
  const tasks = sortTasks((tQ.data ?? []).filter((x) => x.status === 'todo' && x.due_date && x.due_date <= today))
  const top = tasks.filter((x) => x.is_top).slice(0, 3), shown = top.length ? top : tasks.slice(0, 3)
  const upcoming = (dQ.data ?? []).filter((d) => d.status !== 'submitted').slice(0, 5)
  const goal = profile?.daily_study_goal_minutes ?? 120
  const studied = Math.round((ssQ.data ?? []).filter((s) => s.started_at >= range.start && s.started_at < range.end).reduce((a, s) => a + s.focus_seconds, 0) / 60)

  const doneToday = (tQ.data ?? []).filter((x) => x.status === 'done' && x.completed_at && x.completed_at >= range.start && x.completed_at < range.end).length
  const deck = (vQ.data ?? []).filter((v) => v.language === studyLang)
  const reviewed = deck.filter((v) => v.last_reviewed_at && v.last_reviewed_at >= range.start).length
  const dueWords = deck.filter((v) => !v.due_date || v.due_date <= today).length
  const semPct = sem ? Math.min(100, Math.max(0, ((+new Date(today) - +new Date(sem.start_date)) / Math.max(1, +new Date(sem.end_date) - +new Date(sem.start_date))) * 100)) : 0
  const ci = (ckQ.data ?? []).find((c) => c.date === today)
  const waterGoal = profile?.water_goal_ml ?? 2000
  const complete = async (x: Task) => {
    await taskTbl.update.mutateAsync({ id: x.id, patch: { status: 'done', completed_at: new Date().toISOString() } })
    show(t('task.completedToast'), { actionLabel: t('common.undo'), onAction: () => void taskTbl.update.mutateAsync({ id: x.id, patch: { status: 'todo', completed_at: null } }) })
  }
  const Greeting = vis.greeting === false ? null : (
    <Card glass className="md:col-span-2">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3"><p className="text-sm text-text-2">{formatDate(now, lang, tz)}</p>{vis.study !== false && <Button className="hidden md:inline-flex" onClick={() => nav('/study')}><Timer size={16} strokeWidth={1.7} aria-hidden />{t('dash.startStudy')}</Button>}</div>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight md:text-[34px]">{t(`dashboard.${greeting}`, { name: profile?.display_name ?? '' }).replace(/,\s*$/, '')}</h1>
          {sem && w ? (<div className="mt-3 max-w-md">
              <div className="mb-1.5 flex items-center justify-between text-xs text-text-2"><span className="font-medium text-text">{sem.name} · {t('dash.weekOf', { week: w.week, total: w.total })}</span><span className="tnum">{t('dash.daysLeft', { count: daysLeft })}</span></div>
              <div className="semester-bar h-1.5 overflow-hidden rounded-full bg-surface-2"><span className="block h-full rounded-full bg-primary-strong" style={{ width: `${semPct}%` }} /></div></div>)
            : <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-text-2"><span>{t('dash.noSemester')}</span><Button variant="secondary" onClick={() => forms.open({ kind: 'semester' })}>{t('dash.createSemester')}</Button></div>}
        </div>
        {vis.study !== false && <Button className="md:hidden" onClick={() => nav('/study')}><Timer size={16} strokeWidth={1.7} aria-hidden />{t('dash.startStudy')}</Button>}
        {vis.weather !== false && <div className="md:w-80 md:border-l md:border-border md:pl-5"><WeatherCard /></div>}
      </div>
      <div className="mt-5 grid grid-cols-4 gap-2 border-t border-border pt-4">
        <Link to="/study" className="lift rounded-card py-1"><Ring icon={Timer} label={t('dash.rStudy')} value={studied} max={goal} display={`${studied}m`} /></Link>
        <Link to="/tasks" className="lift rounded-card py-1"><Ring icon={ListChecks} label={t('dash.rTasks')} value={doneToday} max={doneToday + tasks.length} display={`${doneToday}/${doneToday + tasks.length}`} color="#5FA88A" /></Link>
        <Link to="/wellbeing" className="lift rounded-card py-1"><Ring icon={Droplets} label={t('dash.rWater')} value={ci?.water_ml ?? 0} max={waterGoal} display={`${((ci?.water_ml ?? 0) / 1000).toFixed(1)}L`} color="#5B9BD9" /></Link>
        <Link to="/languages" className="lift rounded-card py-1"><Ring icon={BookOpenCheck} label={t('dash.rWords')} value={reviewed} max={reviewed + dueWords} display={`${reviewed}/${reviewed + dueWords}`} color="#E0A458" /></Link>
      </div>
    </Card>
  )
  return (
    <section>
      <QueryGuard q={qs} rows={4}>
        <div className="stagger grid gap-4 md:grid-cols-2">
          {Greeting}
          <div className="flex flex-col gap-4">
            {vis.schedule !== false && (
              <Card glass><CardHeader icon={CalendarDays} title={t('dash.schedule')} to="/planner" linkLabel={t('dash.seeAll')} />
                {schedule.length === 0 ? <EmptyState compact icon={CalendarDays} title={t('dash.emptySchedule')} hint={t('dash.scheduleHint')} action={<Button variant="secondary" onClick={() => forms.open({ kind: 'event' })}>{t('dash.addEvent')}</Button>} /> : (
                  <ol className="relative flex flex-col gap-1.5 before:absolute before:bottom-3 before:left-[5px] before:top-3 before:w-px before:bg-border">{schedule.map((i, idx) => { const past = i.end <= now.toISOString(), live = i.start <= now.toISOString() && !past
                    return <li key={i.key} className={`relative flex items-center gap-3 pl-5 ${past ? 'opacity-50' : ''}`}>
                      <span aria-hidden className={`absolute left-0 h-[11px] w-[11px] rounded-full border-2 border-surface ${live ? 'animate-pulse' : ''}`} style={{ background: (i.courseId && courses.get(i.courseId)?.color) || 'var(--primary-strong)' }} />
                      <div style={chipStyle(i, i.courseId ? courses.get(i.courseId) : undefined)} className={`flex min-h-11 flex-1 items-center gap-3 rounded-chip px-3 text-sm ${idx === nextIdx ? 'ring-2 ring-primary-strong' : ''}`}>
                        <span className="tnum w-24 shrink-0 text-xs text-text-2">{i.allDay ? t('dash.allDay') : `${hm(i.start, tz)}–${hm(i.end, tz)}`}</span><span className="truncate font-medium">{i.title}</span>{idx === nextIdx && <span className="ml-auto shrink-0 rounded-full bg-ink px-2 py-0.5 text-[11px] text-on-ink">{live ? t('dash.now') : t('dash.next')}</span>}</div></li> })}</ol>)}</Card>)}
            {vis.tasks !== false && (
              <Card glass><CardHeader icon={CheckCircle2} title={t('dash.tasks')} to="/tasks" linkLabel={tasks.length > shown.length ? t('dash.moreTasks', { count: tasks.length - shown.length }) : t('dash.seeAll')} tint="var(--course-3, #4E9F8E)" />
                {shown.length === 0 ? <EmptyState compact icon={CheckCircle2} title={t('empty.tasks')} hint={t('dash.tasksHint')} action={<Button variant="secondary" onClick={() => forms.open({ kind: 'task' })}>{t('dash.addTask')}</Button>} /> : (
                  <ul className="flex flex-col">{shown.map((x) => <li key={x.id}><div className="flex min-h-12 items-center gap-3 rounded-input px-1"><CheckButton checked={false} label={x.title} onChange={() => void complete(x)} /><span className="task-title flex-1">{x.title}</span>{x.is_top && <Flame size={15} strokeWidth={1.6} className="shrink-0 text-[var(--danger,#D2564B)]" aria-hidden />}</div></li>)}</ul>)}</Card>)}
          </div>
          <div className="flex flex-col gap-4">
            {vis.deadlines !== false && (
              <Card glass><CardHeader icon={Clock} title={t('dash.deadlines')} to="/deadlines" linkLabel={t('dash.seeAll')} tint="var(--course-6, #D9822B)" />
                {upcoming.length === 0 ? <EmptyState compact icon={Clock} title={t('empty.deadlines')} hint={t('dash.deadlinesHint')} action={<Button variant="secondary" onClick={() => forms.open({ kind: 'deadline' })}>{t('dash.addDeadline')}</Button>} /> : <ul className="flex flex-col">{upcoming.map((d) => { const c = countdown(d.due_at, now), course = d.course_id ? courses.get(d.course_id) : undefined
                  return <li key={d.id}><Link to="/deadlines" className="flex min-h-12 items-center gap-3 rounded-input px-1 text-sm hover:bg-surface-2"><span aria-hidden className="h-8 w-1 shrink-0 rounded-full" style={{ background: course?.color ?? 'var(--border)' }} /><span className="min-w-0 flex-1"><span className="block truncate font-medium">{d.title}</span>{course && <span className="block truncate text-xs text-text-2">{course.code}</span>}</span>
                    <span className={`tnum shrink-0 rounded-full px-2.5 py-0.5 text-xs ${LEVEL_STYLE[c.level]}`}>{countdownLabel(t, c)}</span></Link></li> })}</ul>}</Card>)}
            <Card glass><CardHeader icon={Quote} title={t('dash.quote')} /><QuoteOfDay tz={tz} /></Card>
            {vis.words !== false && <WordOfDayCard today={today} />}
          </div>
        </div>
      </QueryGuard>
    </section>
  )
}
