import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useForms } from '@/app/FormHost'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { QueryGuard } from '@/components/QueryGuard'
import { rpc, useCascadeDelete, useTable } from '@/lib/data'
import { formatDate } from '@/lib/format'
import type { Lang } from '@/lib/i18n'
import { useBreaks, useCourses, useDeadlines, useSemesters, useTasks, useTz } from '@/lib/queries'
import { addDaysISO, semesterWeek, todayISO } from '@/lib/time'
import type { Semester } from '@/lib/types'

export function SemestersPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const tz = useTz()
  const forms = useForms()
  const semsQ = useSemesters(), breaksQ = useBreaks(), coursesQ = useCourses(), dlQ = useDeadlines(), tasksQ = useTasks()
  const sems = useTable<Semester>('semesters')
  const cascade = useCascadeDelete('soft_delete_semester')
  const today = todayISO(tz)
  const fmt = (d: string) => formatDate(new Date(d + 'T12:00:00Z'), lang, 'UTC')

  const askDelete = (s: Semester) => {
    const cs = (coursesQ.data ?? []).filter((c) => c.semester_id === s.id)
    const ids = new Set(cs.map((c) => c.id))
    forms.confirm({
      title: t('sem.confirmTitle'),
      body: t('sem.confirmBody', { courses: cs.length, deadlines: (dlQ.data ?? []).filter((d) => d.course_id && ids.has(d.course_id)).length, tasks: (tasksQ.data ?? []).filter((x) => x.course_id && ids.has(x.course_id)).length }),
      onConfirm: () => cascade(s.id),
    })
  }
  const list = semsQ.data ?? []
  return (
    <section>
      <PageHeader title={t('sem.title')} action={<Button onClick={() => forms.open({ kind: 'semester' })}><Plus size={18} strokeWidth={1.5} aria-hidden />{t('sem.add')}</Button>} />
      <QueryGuard q={[semsQ, breaksQ]}>
        {list.length === 0 ? <EmptyState title={t('empty.semesters')} action={<Button onClick={() => forms.open({ kind: 'semester' })}>{t('sem.create')}</Button>} /> : (
          <div className="stagger flex flex-col gap-3">
            {list.map((s) => {
              const w = semesterWeek(s, breaksQ.data ?? [], today)
              const daysLeft = Math.max(0, Math.round((+new Date(s.end_date) - +new Date(today)) / 86400000))
              const brs = (breaksQ.data ?? []).filter((b) => b.semester_id === s.id)
              return (
                <Card key={s.id} className="lift">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="flex items-center gap-2 text-lg font-semibold">{s.name}{s.is_current && <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-on-ink">{t('sem.currentBadge')}</span>}</h2>
                      <p className="text-sm text-text-2">{fmt(s.start_date)} – {fmt(s.end_date)}</p>
                      {s.is_current && w && <p className="mt-1 text-sm">{t('sem.weekOf', { week: w.week, total: w.total })} · {t('sem.daysLeft', { count: daysLeft })}</p>}
                    </div>
                    <div className="flex gap-1">
                      {!s.is_current && <Button variant="secondary" onClick={() => void rpc('set_current_semester', { p_id: s.id }).then(() => sems.refresh())}>{t('sem.setCurrent')}</Button>}
                      <Button variant="ghost" aria-label={t('common.edit')} onClick={() => forms.open({ kind: 'semester', initial: s })}><Pencil size={18} strokeWidth={1.5} /></Button>
                      <Button variant="ghost" aria-label={t('common.delete')} onClick={() => askDelete(s)}><Trash2 size={18} strokeWidth={1.5} /></Button>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-border pt-3">
                    <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold text-text-2">{t('sem.breaks')}</h3>
                      <Button variant="ghost" onClick={() => forms.open({ kind: 'break', semesterId: s.id })}><Plus size={16} strokeWidth={1.5} aria-hidden />{t('sem.addBreak')}</Button></div>
                    {brs.map((b) => (
                      <button key={b.id} className="t-ui flex min-h-11 w-full items-center justify-between rounded-input px-2 text-left text-sm hover:bg-surface-2" onClick={() => forms.open({ kind: 'break', semesterId: s.id, initial: b })}>
                        <span>{b.name}</span><span className="text-text-2">{fmt(b.start_date)} – {fmt(addDaysISO(b.end_date, 0))}</span>
                      </button>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </QueryGuard>
    </section>
  )
}
