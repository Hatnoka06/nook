import { Pencil, Plus, CheckCircle2, Clock, Timer } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForms } from '@/app/FormHost'
import { Button } from '@/components/Button'
import { CardHeader } from '@/components/CardHeader'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { QueryGuard } from '@/components/QueryGuard'
import { formatDuration } from '@/lib/format'
import type { Lang } from '@/lib/i18n'
import { useCourses, useDeadlines, useMeetings, useSessions, useTasks, useTz } from '@/lib/queries'
import { addDaysISO, dayRangeUtc, startOfWeekISO, todayISO } from '@/lib/time'

export function CourseDetailPage() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const tz = useTz()
  const forms = useForms()
  const cQ = useCourses(), mQ = useMeetings(), dQ = useDeadlines(), tQ = useTasks(), sQ = useSessions()
  const course = (cQ.data ?? []).find((c) => c.id === id)
  const weekStart = dayRangeUtc(startOfWeekISO(todayISO(tz), 1), tz).start
  const weekEnd = dayRangeUtc(addDaysISO(startOfWeekISO(todayISO(tz), 1), 6), tz).end
  const mins = Math.round((sQ.data ?? []).filter((s) => s.course_id === id && s.started_at >= weekStart && s.started_at < weekEnd).reduce((a, s) => a + s.focus_seconds, 0) / 60)
  return (
    <section>
      <QueryGuard q={[cQ, mQ, dQ, tQ, sQ]}>
        {!course ? <EmptyState title={t('empty.courses')} action={<Link to="/courses"><Button>{t('course.title')}</Button></Link>} /> : (<>
          <PageHeader title={`${course.code} · ${course.name}`} subtitle={course.lecturer ?? undefined}
            action={<Button variant="secondary" onClick={() => forms.open({ kind: 'course', initial: course })}><Pencil size={16} strokeWidth={1.5} aria-hidden />{t('common.edit')}</Button>} />
          <div className="stagger grid gap-4 md:grid-cols-2">
            <Card style={{ borderLeft: `3px solid ${course.color}` }}>
              <div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">{t('course.meetings')}</h2>
                <Button variant="ghost" onClick={() => forms.open({ kind: 'meeting', courseId: course.id })}><Plus size={16} strokeWidth={1.5} aria-hidden />{t('course.addMeeting')}</Button></div>
              {(mQ.data ?? []).filter((m) => m.course_id === course.id).sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time)).map((m) => (
                <button key={m.id} onClick={() => forms.open({ kind: 'meeting', courseId: course.id, initial: m })} className="t-ui flex min-h-11 w-full items-center justify-between rounded-input px-2 text-left text-sm hover:bg-surface-2">
                  <span>{t(`days.${m.weekday}`)} {m.start_time.slice(0, 5)}–{m.end_time.slice(0, 5)}</span><span className="text-text-2">{t(`course.${m.type}`)}{m.location ? ` · ${m.location}` : ''}</span>
                </button>
              ))}
              {!(mQ.data ?? []).some((m) => m.course_id === course.id) && <p className="text-sm text-text-2">{t('course.noMeetings')}</p>}
            </Card>
            <Card><CardHeader icon={Timer} title={t('course.studyThisWeek')} /><p className="tnum text-2xl font-bold">{formatDuration(mins, lang)}</p></Card>
            <Card><CardHeader icon={Clock} title={t('course.upcomingDeadlines')} />
              {(dQ.data ?? []).filter((d) => d.course_id === course.id).map((d) => <p key={d.id} className="py-1 text-sm">{d.title}</p>)}
              {!(dQ.data ?? []).some((d) => d.course_id === course.id) && <p className="text-sm text-text-2">{t('empty.deadlines')}</p>}</Card>
            <Card><CardHeader icon={CheckCircle2} title={t('course.relatedTasks')} />
              {(tQ.data ?? []).filter((x) => x.course_id === course.id && x.status === 'todo').map((x) => <p key={x.id} className="py-1 text-sm">{x.title}</p>)}
              {!(tQ.data ?? []).some((x) => x.course_id === course.id) && <p className="text-sm text-text-2">{t('empty.tasks')}</p>}</Card>
          </div>
        </>)}
      </QueryGuard>
    </section>
  )
}
