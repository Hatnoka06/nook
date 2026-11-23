import { AlertTriangle, CheckCircle2, Plus, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForms } from '@/app/FormHost'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { QueryGuard } from '@/components/QueryGuard'
import { computeCourse, DEFAULT_SCALE, gpa, gpaPoints, gradeFor, suggestLower, type Assess } from '@/lib/grades'
import { useAssessments, useCourses, useCurrentSemester, useResults } from '@/lib/queries'
import type { Assessment, Course } from '@/lib/types'

const f1 = (n: number) => (Number.isFinite(n) ? n.toFixed(1).replace(/\.0$/, '') : '∞')

function CourseGrade({ course, list }: { course: Course; list: Assessment[] }) {
  const { t } = useTranslation()
  const forms = useForms()
  const [whatIf, setWhatIf] = useState<Record<string, string>>({})
  const asAssess: Assess[] = list.map((a) => {
    const w = whatIf[a.id]
    return { weight: a.weight_pct, mark: a.mark ?? (w !== undefined && w !== '' ? Number(w) : null), max: a.max_mark, hurdle: a.hurdle, hurdleMinPct: a.hurdle_min_pct }
  })
  const calc = useMemo(() => computeCourse(asAssess, DEFAULT_SCALE), [JSON.stringify(asAssess)]) // eslint-disable-line react-hooks/exhaustive-deps
  const target = course.target_grade ?? 'D'
  const tRow = calc.targets.find((x) => x.grade === target)
  const lower = tRow?.state === 'impossible' ? suggestLower(calc, target) : null
  const ungraded = list.filter((a) => a.mark == null)
  return (
    <Card glass className="lift" style={{ borderLeft: `3px solid ${course.color}` }}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div><h2 className="text-lg font-semibold">{course.code}</h2><p className="text-sm text-text-2">{course.name}</p></div>
        <Button variant="secondary" onClick={() => forms.open({ kind: 'assessment', courseId: course.id })}><Plus size={16} strokeWidth={1.5} aria-hidden />{t('grade.addAssessment')}</Button>
      </div>
      {list.length === 0 ? <p className="text-sm text-text-2">{t('grade.noAssessments')}</p> : (<>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div><p className="text-xs text-text-2">{t('grade.accumulated')}</p><p className="tnum text-3xl font-bold">{f1(calc.accumulated)}<span className="text-base text-text-2"> / {f1(calc.gradedWeight)}</span></p></div>
          <div><p className="text-xs text-text-2">{t('grade.projected')}</p><p className="tnum text-3xl font-bold">{calc.projected == null ? '–' : f1(calc.projected)}{calc.projected != null && <span className="ml-2 rounded-full bg-ink px-2 py-0.5 align-middle text-xs font-medium text-on-ink">{gradeFor(calc.projected, DEFAULT_SCALE)}</span>}</p></div>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[...calc.targets].reverse().map((x) => (
            <div key={x.grade} className={`rounded-input border border-border p-2 text-center ${x.grade === target ? 'ring-2 ring-primary-strong' : ''}`}>
              <p className="flex items-center justify-center gap-1 text-sm font-semibold">{x.state === 'achieved' ? <CheckCircle2 size={14} strokeWidth={1.5} aria-hidden /> : x.state === 'impossible' ? <XCircle size={14} strokeWidth={1.5} aria-hidden /> : null}{x.grade}<span className="text-xs font-normal text-text-2">≥{x.min}</span></p>
              <p className="tnum text-xs text-text-2">{x.state === 'achieved' ? t('grade.achieved') : x.state === 'impossible' ? t('grade.impossible') : t('grade.needed', { n: f1(x.needed) })}</p>
            </div>))}
        </div>
        {lower && <p className="mb-2 text-sm">{t('grade.suggest', { g: lower })}</p>}
        {calc.weightMismatch && <p role="status" className="mb-2 flex items-start gap-2 rounded-input bg-surface-2 p-2 text-sm"><AlertTriangle size={16} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0" />{t('grade.weightWarn', { n: f1(calc.totalWeight) })}</p>}
        {calc.hurdleFailed && <p role="alert" className="mb-2 flex items-start gap-2 rounded-input bg-danger-soft/50 p-2 text-sm"><AlertTriangle size={16} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0" />{t('grade.hurdleWarn')}</p>}
        <ul className="mb-2 divide-y divide-border">
          {list.map((a) => (
            <li key={a.id} className="flex min-h-11 items-center gap-2 text-sm">
              <button className="min-w-0 flex-1 truncate text-left" onClick={() => forms.open({ kind: 'assessment', courseId: course.id, initial: a })}>{a.name}{a.hurdle ? ' ⚑' : ''}</button>
              <span className="tnum w-12 text-right text-text-2">{a.weight_pct}%</span>
              <span className="tnum w-20 text-right">{a.mark != null ? `${a.mark}/${a.max_mark}` : (
                <input aria-label={`${t('grade.whatIf')} ${a.name}`} placeholder={t('grade.whatIf')} inputMode="decimal" value={whatIf[a.id] ?? ''} onChange={(e) => setWhatIf({ ...whatIf, [a.id]: e.target.value })} className="h-9 w-20 rounded-input border border-dashed border-border bg-transparent px-2 text-right" />)}</span>
            </li>))}
        </ul>
        {ungraded.length > 0 && Object.values(whatIf).some(Boolean) && <Button variant="ghost" onClick={() => setWhatIf({})}>{t('grade.reset')}</Button>}
        <p className="text-xs text-text-2">{t('grade.remaining', { n: f1(calc.remainingWeight) })} · {t('grade.target')}: {target}</p>
      </>)}
    </Card>
  )
}

export function GradesPage() {
  const { t } = useTranslation()
  const forms = useForms()
  const cQ = useCourses(), aQ = useAssessments(), rQ = useResults()
  const sem = useCurrentSemester()
  const courses = (cQ.data ?? []).filter((c) => !c.is_archived && (c.semester_id === sem?.id || c.kind === 'self' || !sem))
  const byCourse = (id: string) => (aQ.data ?? []).filter((a) => a.course_id === id)
  const cumulative = gpa((rQ.data ?? []).filter((r) => r.final_grade).map((r) => ({ credit: r.credit_points, points: gpaPoints(r.final_grade!, DEFAULT_SCALE) })))
  const projected = gpa(courses.flatMap((c) => { const calc = computeCourse(byCourse(c.id).map((a) => ({ weight: a.weight_pct, mark: a.mark, max: a.max_mark })), DEFAULT_SCALE)
    return calc.projected == null ? [] : [{ credit: c.credit_points, points: gpaPoints(gradeFor(calc.projected, DEFAULT_SCALE), DEFAULT_SCALE) }] }))
  return (
    <section>
      <PageHeader title={t('grade.title')} subtitle={t('grade.subtitle')} action={<Button variant="secondary" onClick={() => forms.open({ kind: 'result' })}><Plus size={18} strokeWidth={1.5} aria-hidden />{t('grade.addResult')}</Button>} />
      <QueryGuard q={[cQ, aQ, rQ]} rows={3}>
        <div className="stagger flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card glass><p className="text-sm text-text-2">{t('grade.gpa')} · {t('grade.gpaSemester')}</p><p className="tnum text-4xl font-bold">{projected == null ? '–' : projected.toFixed(2)}</p></Card>
            <Card glass><p className="text-sm text-text-2">{t('grade.gpa')} · {t('grade.gpaCumulative')}</p><p className="tnum text-4xl font-bold">{cumulative == null ? '–' : cumulative.toFixed(2)}</p>
              <div className="mt-1 flex flex-wrap gap-1">{(rQ.data ?? []).map((r) => <button key={r.id} onClick={() => forms.open({ kind: 'result', initial: r })} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">{(cQ.data ?? []).find((c) => c.id === r.course_id)?.code} {r.final_grade}</button>)}</div></Card>
          </div>
          {courses.length === 0 ? <EmptyState title={t('grade.noCourses')} /> : courses.map((c) => <CourseGrade key={c.id} course={c} list={byCourse(c.id)} />)}
          <p className="text-xs text-text-2">{t('grade.scaleNote')}</p>
        </div>
      </QueryGuard>
    </section>
  )
}
