import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'
import { MiniBars } from '@/components/MiniBars'
import { formatDuration } from '@/lib/format'
import type { Lang } from '@/lib/i18n'
import { useCourseMap, useSessions, useTz } from '@/lib/queries'
import { minutesByCourse, minutesByDay } from '@/lib/stats'
import { addDaysISO, dayRangeUtc, startOfWeekISO, todayISO } from '@/lib/time'
import { useProfile } from '@/features/auth/useProfile'

export function StudyStats() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const tz = useTz()
  const goal = useProfile().profile?.daily_study_goal_minutes ?? 120
  const { data } = useSessions()
  const courses = useCourseMap()
  const today = todayISO(tz)
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(today, i - 6))
  const byDay = minutesByDay(data ?? [], days, tz)
  const todayMin = byDay[6].minutes
  const wk = startOfWeekISO(today, 1)
  const byCourse = minutesByCourse(data ?? [], dayRangeUtc(wk, tz).start, dayRangeUtc(addDaysISO(wk, 6), tz).end)
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card><p className="text-sm text-text-2">{t('study.today')}</p><p className="tnum text-2xl font-bold">{formatDuration(todayMin, lang)}</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={todayMin} aria-valuemax={goal} aria-label={t('study.today')}><div className="h-full rounded-full bg-primary-strong" style={{ width: `${Math.min(100, (todayMin / goal) * 100)}%` }} /></div>
        <p className="mt-1 text-xs text-text-2">{t('study.goalLabel')}: {formatDuration(goal, lang)}</p></Card>
      <Card>
        <p className="mb-2 text-sm text-text-2">{t('study.last7')}</p>
        <MiniBars data={byDay.map((d) => ({ d: d.day, v: d.minutes }))} max={goal} label={t('study.last7')} unit="min" highlight={today} />
        <table className="sr-only"><tbody>{byDay.map((d) => <tr key={d.day}><td>{d.day}</td><td>{d.minutes}</td></tr>)}</tbody></table>
      </Card>
      <Card><p className="mb-2 text-sm text-text-2">{t('study.byCourse')}</p>
        {byCourse.length === 0 ? <p className="text-sm text-text-2">{t('empty.study')}</p> : byCourse.map((r) => { const c = r.course_id ? courses.get(r.course_id) : undefined
          return <p key={r.course_id ?? 'none'} className="flex items-center justify-between py-0.5 text-sm"><span className="flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: c?.color ?? 'var(--border)' }} />{c?.code ?? t('study.noCourse')}</span><span className="tnum">{formatDuration(r.minutes, lang)}</span></p> })}</Card>
    </div>
  )
}
