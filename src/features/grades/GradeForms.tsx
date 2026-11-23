import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { CheckField, SelectField, TextField } from '@/components/fields'
import { FormSheet } from '@/components/FormSheet'
import { useTable } from '@/lib/data'
import { useCourses, useDeadlines } from '@/lib/queries'
import type { Assessment, CourseResult } from '@/lib/types'
import { validate } from '@/lib/validate'

const num = (s: string) => (s.trim() === '' ? null : Number(s))
const aSchema = z.object({ name: z.string().trim().min(1, 'common.required'), weight_pct: z.number().min(0).max(100), mark: z.number().min(0).nullable(), max_mark: z.number().positive(),
  hurdle: z.boolean(), hurdle_min_pct: z.number().min(0).max(100).nullable(), deadline_id: z.string().nullable() })

export function AssessmentForm({ courseId, initial, onClose }: { courseId: string; initial?: Assessment; onClose: () => void }) {
  const { t } = useTranslation()
  const tbl = useTable<Assessment>('assessments')
  const { data: deadlines } = useDeadlines()
  const [v, setV] = useState({ name: initial?.name ?? '', weight: String(initial?.weight_pct ?? ''), mark: String(initial?.mark ?? ''), max: String(initial?.max_mark ?? 100), hurdle: initial?.hurdle ?? false, hmin: String(initial?.hurdle_min_pct ?? 40), deadline: initial?.deadline_id ?? '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submit = async () => {
    const r = validate(aSchema, { name: v.name, weight_pct: Number(v.weight || 0), mark: num(v.mark), max_mark: Number(v.max || 100), hurdle: v.hurdle, hurdle_min_pct: v.hurdle ? num(v.hmin) : null, deadline_id: v.deadline || null }, t)
    if (!r.ok) { setErrors(r.errors); return false }
    if (initial) await tbl.update.mutateAsync({ id: initial.id, patch: r.data }); else await tbl.insert.mutateAsync({ ...r.data, course_id: courseId })
  }
  return (
    <FormSheet title={initial ? t('grade.editAssessment') : t('grade.addAssessment')} onClose={onClose} onSubmit={submit} onDelete={initial ? () => tbl.remove(initial.id) : undefined}>
      <TextField label={t('grade.name')} value={v.name} error={errors.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoFocus />
      <div className="grid grid-cols-3 gap-3">
        <TextField label={t('grade.weight')} type="number" inputMode="decimal" value={v.weight} onChange={(e) => setV({ ...v, weight: e.target.value })} />
        <TextField label={t('grade.mark')} type="number" inputMode="decimal" value={v.mark} onChange={(e) => setV({ ...v, mark: e.target.value })} />
        <TextField label={t('grade.max')} type="number" inputMode="decimal" value={v.max} onChange={(e) => setV({ ...v, max: e.target.value })} />
      </div>
      <CheckField label={t('grade.hurdle')} checked={v.hurdle} onChange={(e) => setV({ ...v, hurdle: e.target.checked })} />
      {v.hurdle && <TextField label={t('grade.hurdleMin')} type="number" inputMode="decimal" value={v.hmin} onChange={(e) => setV({ ...v, hmin: e.target.value })} />}
      <SelectField label={t('grade.linkDeadline')} value={v.deadline} onChange={(e) => setV({ ...v, deadline: e.target.value })} options={[{ value: '', label: t('common.none') }, ...(deadlines ?? []).map((d) => ({ value: d.id, label: d.title }))]} />
    </FormSheet>
  )
}

export function ResultForm({ initial, onClose }: { initial?: CourseResult; onClose: () => void }) {
  const { t } = useTranslation()
  const tbl = useTable<CourseResult>('course_results')
  const { data: courses } = useCourses()
  const [v, setV] = useState({ course_id: initial?.course_id ?? courses?.[0]?.id ?? '', grade: (initial?.final_grade ?? 'D') as string, mark: String(initial?.final_mark ?? ''), credit: String(initial?.credit_points ?? 10) })
  const submit = async () => {
    if (!v.course_id) return false
    const row = { course_id: v.course_id, final_grade: v.grade as CourseResult['final_grade'], final_mark: num(v.mark), credit_points: Number(v.credit || 10) }
    if (initial) await tbl.update.mutateAsync({ id: initial.id, patch: row }); else await tbl.insert.mutateAsync(row)
  }
  return (
    <FormSheet title={initial ? t('grade.editResult') : t('grade.addResult')} onClose={onClose} onSubmit={submit} onDelete={initial ? () => tbl.remove(initial.id) : undefined}>
      <SelectField label={t('grade.course')} value={v.course_id} onChange={(e) => setV({ ...v, course_id: e.target.value })} options={(courses ?? []).map((c) => ({ value: c.id, label: `${c.code} ${c.name}` }))} />
      <div className="grid grid-cols-3 gap-3">
        <SelectField label={t('grade.finalGrade')} value={v.grade} onChange={(e) => setV({ ...v, grade: e.target.value })} options={['HD', 'D', 'Cr', 'P', 'F'].map((g) => ({ value: g, label: g }))} />
        <TextField label={t('grade.finalMark')} type="number" inputMode="decimal" value={v.mark} onChange={(e) => setV({ ...v, mark: e.target.value })} />
        <TextField label={t('grade.credit')} type="number" inputMode="decimal" value={v.credit} onChange={(e) => setV({ ...v, credit: e.target.value })} />
      </div>
    </FormSheet>
  )
}
