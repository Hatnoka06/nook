import { ArrowLeft, Pin, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { SelectField, TextField } from '@/components/fields'
import { QueryGuard } from '@/components/QueryGuard'
import { useTable } from '@/lib/data'
import { Markdown, toggleChecklistLine } from '@/lib/markdown'
import { useCourseMap, useCourses, useNotes } from '@/lib/queries'
import { safeGet, safeSet } from '@/lib/storage'
import { matchesSearch } from '@/lib/text'
import type { Note } from '@/lib/types'

type Status = 'saved' | 'saving' | 'unsaved'
const draftKey = (id: string) => `uniflow.note.${id}`

function Editor({ note, onBack }: { note: Note; onBack: () => void }) {
  const { t } = useTranslation()
  const tbl = useTable<Note>('notes')
  const { data: courses } = useCourses()
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(() => safeGet(draftKey(note.id)) ?? note.body) // unsaved draft survives a lost connection
  const [course, setCourse] = useState(note.course_id ?? '')
  const [preview, setPreview] = useState(false)
  const [status, setStatus] = useState<Status>('saved')
  const [base, setBase] = useState(note.updated_at)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const latest = useRef({ title, body, course })
  const conflict = note.updated_at !== base && status !== 'saved'

  const flush = async () => {
    const v = latest.current; setStatus('saving')
    try { await tbl.update.mutateAsync({ id: note.id, patch: { title: v.title, body: v.body, course_id: v.course || null } }); safeSet(draftKey(note.id), ''); setStatus('saved') }
    catch { setStatus('unsaved') }
  }
  const edit = (patch: Partial<typeof latest.current>) => {
    latest.current = { ...latest.current, ...patch }
    if (patch.body !== undefined) safeSet(draftKey(note.id), patch.body)
    setStatus('unsaved'); clearTimeout(timer.current); timer.current = setTimeout(() => void flush(), 1000)
  }
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => { if (status === 'saved') setBase(note.updated_at) }, [note.updated_at, status])
  const reload = () => { setTitle(note.title); setBody(note.body); setCourse(note.course_id ?? ''); latest.current = { title: note.title, body: note.body, course: note.course_id ?? '' }; safeSet(draftKey(note.id), ''); setStatus('saved'); setBase(note.updated_at) }

  return (
    <Card glass className="flex min-h-[70dvh] flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" className="lg:hidden" aria-label={t('notes.back')} onClick={onBack}><ArrowLeft size={18} strokeWidth={1.5} /></Button>
        <input aria-label={t('notes.titlePh')} placeholder={t('notes.titlePh')} value={title} onChange={(e) => { setTitle(e.target.value); edit({ title: e.target.value }) }} className="min-h-11 flex-1 bg-transparent text-2xl font-bold outline-none" />
        <Button variant="ghost" aria-label={note.pinned ? t('notes.unpin') : t('notes.pin')} aria-pressed={note.pinned} onClick={() => void tbl.update.mutateAsync({ id: note.id, patch: { pinned: !note.pinned } })}><Pin size={18} strokeWidth={1.5} className={note.pinned ? 'fill-current' : ''} /></Button>
        <Button variant="ghost" aria-label={t('notes.delete')} onClick={async () => { await tbl.remove(note.id); onBack() }}><Trash2 size={18} strokeWidth={1.5} /></Button>
      </div>
      {conflict && <p role="alert" className="flex items-center justify-between gap-2 rounded-input bg-surface-2 p-2 text-sm">{t('notes.conflict')}<Button variant="secondary" onClick={reload}>{t('notes.reload')}</Button></p>}
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" className="inline-flex gap-1 rounded-full border border-border bg-surface-2 p-1">
          {[false, true].map((p) => <button key={String(p)} aria-pressed={preview === p} onClick={() => setPreview(p)} className={`t-ui min-h-10 rounded-full px-4 text-sm ${preview === p ? 'bg-ink text-on-ink' : 'text-text-2'}`}>{p ? t('notes.preview') : t('notes.write')}</button>)}</div>
        <div className="w-44"><SelectField label={t('notes.course')} value={course} onChange={(e) => { setCourse(e.target.value); edit({ course: e.target.value }) }} options={[{ value: '', label: t('common.none') }, ...(courses ?? []).map((c) => ({ value: c.id, label: c.code }))]} /></div>
        <p role="status" className="ml-auto flex items-center gap-2 text-sm text-text-2">{status === 'saved' ? t('notes.saved') : status === 'saving' ? t('notes.saving') : t('notes.unsaved')}{status === 'unsaved' && <Button variant="ghost" onClick={() => void flush()}>{t('notes.retry')}</Button>}</p>
      </div>
      {preview ? <div className="flex-1"><Markdown source={body} onToggle={(line) => { const next = toggleChecklistLine(body, line); setBody(next); edit({ body: next }) }} /></div> : (
        <textarea aria-label={t('notes.bodyPh')} placeholder={t('notes.bodyPh')} value={body} maxLength={100000} onChange={(e) => { setBody(e.target.value); edit({ body: e.target.value }) }} className="min-h-[50dvh] w-full flex-1 resize-none bg-transparent font-mono text-sm leading-relaxed outline-none" />)}
    </Card>
  )
}

export function NotesPage() {
  const { t } = useTranslation()
  const nQ = useNotes(), cQ = useCourses()
  const courses = useCourseMap()
  const tbl = useTable<Note>('notes')
  const [q, setQ] = useState('')
  const [course, setCourse] = useState('')
  const [sel, setSel] = useState<string | null>(null)
  const list = useMemo(() => (nQ.data ?? []).filter((n) => (!course || n.course_id === course) && matchesSearch(`${n.title} ${n.body}`, q))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated_at.localeCompare(a.updated_at)), [nQ.data, q, course])
  const note = (nQ.data ?? []).find((n) => n.id === sel)
  const create = async () => { const n = await tbl.insert.mutateAsync({ title: '', body: '' } as Partial<Note>); setSel(n.id) }
  return (
    <section>
      <PageHeader title={t('notes.title')} action={<Button onClick={() => void create()}><Plus size={18} strokeWidth={1.5} aria-hidden />{t('notes.new')}</Button>} />
      <QueryGuard q={[nQ, cQ]} rows={4}>
        <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-4">
          <div className={`flex flex-col gap-3 ${sel ? 'hidden lg:flex' : ''}`}>
            <TextField label={t('common.search')} placeholder={t('notes.search')} value={q} onChange={(e) => setQ(e.target.value)} />
            <SelectField label={t('notes.course')} value={course} onChange={(e) => setCourse(e.target.value)} options={[{ value: '', label: t('common.all') }, ...[...courses.values()].map((c) => ({ value: c.id, label: c.code }))]} />
            {list.length === 0 ? <EmptyState title={t('notes.empty')} action={<Button onClick={() => void create()}>{t('notes.emptyBody')}</Button>} /> : (
              <ul className="stagger flex flex-col gap-2">{list.map((n) => (
                <li key={n.id}><button onClick={() => setSel(n.id)} className={`t-ui lift w-full rounded-card border border-border p-3 text-left ${n.id === sel ? 'bg-surface-2' : 'bg-surface'}`} style={{ borderLeft: `3px solid ${n.course_id ? courses.get(n.course_id)?.color : 'var(--border)'}` }}>
                  <p className="flex items-center gap-1 font-medium">{n.pinned && <Pin size={12} strokeWidth={1.5} className="fill-current" aria-label={t('notes.pinned')} />}{n.title || t('notes.untitled')}</p>
                  <p className="line-clamp-2 text-sm text-text-2">{n.body.replace(/[#*`>\-\[\]]/g, '').slice(0, 140)}</p></button></li>))}</ul>)}
          </div>
          <div className={sel ? '' : 'hidden lg:block'}>{note ? <Editor key={note.id} note={note} onBack={() => setSel(null)} /> : <div className="hidden lg:block"><EmptyState title={t('notes.empty')} /></div>}</div>
        </div>
      </QueryGuard>
    </section>
  )
}
