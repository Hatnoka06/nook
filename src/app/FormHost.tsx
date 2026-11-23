import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'
import { Sheet } from '@/components/Sheet'
import { BreakForm, SemesterForm } from '@/features/semesters/SemesterForms'
import { CourseForm, MeetingForm } from '@/features/courses/CourseForms'
import { DeadlineForm } from '@/features/deadlines/DeadlineForm'
import { EventForm } from '@/features/calendar/EventForm'
import { AssessmentForm, ResultForm } from '@/features/grades/GradeForms'
import { TxnForm } from '@/features/finance/TxnForm'
import { VocabForm } from '@/features/languages/VocabForm'
import { SessionForm } from '@/features/study/SessionForm'
import { TaskForm } from '@/features/tasks/TaskForm'
import type { Course, Deadline, Meeting, Semester, SemesterBreak, Task, StudySession, CalEvent, Assessment, CourseResult, Txn, Vocab } from '@/lib/types'
import { useOnline } from '@/lib/useOnline'

export type FormReq =
  | { kind: 'semester'; initial?: Semester }
  | { kind: 'break'; semesterId: string; initial?: SemesterBreak }
  | { kind: 'course'; initial?: Course }
  | { kind: 'meeting'; courseId: string; initial?: Meeting }
  | { kind: 'deadline'; initial?: Deadline }
  | { kind: 'task'; initial?: Task; preset?: Partial<Task> }
  | { kind: 'session'; initial?: StudySession }
  | { kind: 'assessment'; courseId: string; initial?: Assessment }
  | { kind: 'result'; initial?: CourseResult }
  | { kind: 'vocab'; language: 'zh' | 'es'; initial?: Vocab }
  | { kind: 'txn'; initial?: Txn; preset?: { type?: 'expense' | 'income'; category?: string; repeat?: 'weekly' | 'fortnightly' | 'monthly' } }
  | { kind: 'event'; initial?: CalEvent; occurrenceDate?: string; preset?: { start: string; end: string; allDay?: boolean } }
type Confirm = { title: string; body: string; onConfirm: () => Promise<void> | void; confirmLabel?: string }
const Ctx = createContext<{ open: (r: FormReq) => void; confirm: (c: Confirm) => void }>({ open: () => {}, confirm: () => {} })
export const FormHostContext = Ctx
export const useForms = () => useContext(Ctx)

/** Renders exactly one form sheet (or confirm sheet) at a time. */
export function FormHost({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const online = useOnline()
  const [req, setReq] = useState<FormReq | null>(null)
  const [conf, setConf] = useState<Confirm | null>(null)
  const close = useCallback(() => setReq(null), [])
  const open = useCallback((r: FormReq) => { setConf(null); setReq(r) }, [])
  const confirm = useCallback((c: Confirm) => { setReq(null); setConf(c) }, [])
  const value = useMemo(() => ({ open, confirm }), [open, confirm])
  return (
    <Ctx.Provider value={value}>
      {children}
      {req?.kind === 'semester' && <SemesterForm initial={req.initial} onClose={close} />}
      {req?.kind === 'break' && <BreakForm semesterId={req.semesterId} initial={req.initial} onClose={close} />}
      {req?.kind === 'course' && <CourseForm initial={req.initial} onClose={close} />}
      {req?.kind === 'meeting' && <MeetingForm courseId={req.courseId} initial={req.initial} onClose={close} />}
      {req?.kind === 'deadline' && <DeadlineForm initial={req.initial} onClose={close} />}
      {req?.kind === 'task' && <TaskForm initial={req.initial} preset={req.preset} onClose={close} />}
      {req?.kind === 'session' && <SessionForm initial={req.initial} onClose={close} />}
      {req?.kind === 'event' && <EventForm initial={req.initial} occurrenceDate={req.occurrenceDate} preset={req.preset} onClose={close} />}
      {req?.kind === 'assessment' && <AssessmentForm courseId={req.courseId} initial={req.initial} onClose={close} />}
      {req?.kind === 'result' && <ResultForm initial={req.initial} onClose={close} />}
      {req?.kind === 'txn' && <TxnForm initial={req.initial} preset={req.preset} onClose={close} />}
      {req?.kind === 'vocab' && <VocabForm language={req.language} initial={req.initial} onClose={close} />}
      {conf && (
        <Sheet open onOpenChange={(o) => { if (!o) setConf(null) }} title={conf.title}>
          <p className="mb-4 text-text-2">{conf.body}</p>
          <div className="flex gap-2">
            <Button variant="danger" disabled={!online} onClick={async () => { await conf.onConfirm(); setConf(null) }}>{conf.confirmLabel ?? t('common.delete')}</Button>
            <Button variant="ghost" onClick={() => setConf(null)}>{t('common.cancel')}</Button>
          </div>
        </Sheet>
      )}
    </Ctx.Provider>
  )
}
