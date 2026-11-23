import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForms } from '@/app/FormHost'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { CheckField, SelectField, TextField } from '@/components/fields'
import { PageHeader } from '@/components/PageHeader'
import { QueryGuard } from '@/components/QueryGuard'
import { useCourses, useSemesters } from '@/lib/queries'
import { matchesSearch } from '@/lib/text'

export function CoursesPage() {
  const { t } = useTranslation()
  const forms = useForms()
  const coursesQ = useCourses(), semsQ = useSemesters()
  const [q, setQ] = useState('')
  const [sem, setSem] = useState('')
  const [archived, setArchived] = useState(false)
  const list = (coursesQ.data ?? []).filter((c) => (archived || !c.is_archived) && (!sem || c.semester_id === sem) && matchesSearch(`${c.code} ${c.name} ${c.lecturer ?? ''}`, q))
  return (
    <section>
      <PageHeader title={t('course.title')} action={<Button onClick={() => forms.open({ kind: 'course' })}><Plus size={18} strokeWidth={1.5} aria-hidden />{t('course.add')}</Button>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end">
        <TextField label={t('common.search')} placeholder={t('course.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} />
        <SelectField label={t('course.semester')} value={sem} onChange={(e) => setSem(e.target.value)} options={[{ value: '', label: t('common.all') }, ...(semsQ.data ?? []).map((s) => ({ value: s.id, label: s.name }))]} />
        <CheckField label={t('course.showArchived')} checked={archived} onChange={(e) => setArchived(e.target.checked)} />
      </div>
      <QueryGuard q={[coursesQ, semsQ]}>
        {list.length === 0 ? <EmptyState title={t('empty.courses')} action={<Button onClick={() => forms.open({ kind: 'course' })}>{t('course.add')}</Button>} /> : (
          <div className="stagger grid gap-3 md:grid-cols-2">
            {list.map((c) => (
              <Link key={c.id} to={`/courses/${c.id}`}>
                <Card className="lift flex items-center gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
                  <span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} />
                  <div className="min-w-0"><p className="font-semibold">{c.code}{c.is_demo && <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-normal">{t('common.demo')}</span>}</p>
                    <p className="truncate text-sm text-text-2">{c.name}{c.lecturer ? ` · ${c.lecturer}` : ''}</p></div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </QueryGuard>
    </section>
  )
}
