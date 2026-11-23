import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/Toast'
import { mixer } from '@/lib/audio'
import { safeGet, safeSet } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { elapsedSeconds, nextPhase, pauseTimer, phaseEndedAt, remainingSeconds, resumeTimer, shouldSave, targetFor } from '@/lib/timer'
import { useActiveTimer } from '@/lib/queries'
import type { ActiveTimer, StudyMode } from '@/lib/types'

type Pending = { course_id: string | null; task_id: string | null; goal: string | null; mode: StudyMode; started_at: string; ended_at: string; focus_seconds: number }
export type StartArgs = { mode: StudyMode; course_id: string | null; task_id: string | null; goal: string | null; config: Record<string, number> }
const flag = (k: string, d: boolean) => { const v = safeGet(k); return v === null ? d : v === 'true' }

export function useTimer() {
  const { t } = useTranslation()
  const { show } = useToast()
  const qc = useQueryClient()
  const q = useActiveTimer()
  const row: ActiveTimer | undefined = q.data?.[0]
  const [now, setNow] = useState(() => new Date())
  const [pending, setPending] = useState<Pending | null>(null)
  const [saveError, setSaveError] = useState(false)
  const handled = useRef('')
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ['active_timer'] }), [qc])

  useEffect(() => {
    if (row?.status !== 'running') return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [row?.status])

  const saveSession = useCallback(async (p: Pending) => {
    const { error } = await supabase.from('study_sessions').insert(p)
    if (error) { setPending(p); setSaveError(true); return false }
    setPending(null); setSaveError(false); await qc.invalidateQueries({ queryKey: ['study_sessions'] }); return true
  }, [qc])
  const retrySave = () => { if (pending) void saveSession(pending) }

  const record = useCallback(async (r: ActiveTimer, endedAt: Date, focusSeconds: number) => {
    if (r.phase !== 'focus' || !shouldSave(focusSeconds)) return
    await saveSession({ course_id: r.course_id, task_id: r.task_id, goal: r.goal, mode: r.mode, started_at: r.phase_started_at, ended_at: endedAt.toISOString(), focus_seconds: focusSeconds })
  }, [saveSession])

  /** Move to the next phase. Guarded by phase_started_at so two devices never both record the same phase. */
  const advance = useCallback(async (r: ActiveTimer, endedAt: Date, recordFocus: boolean) => {
    const n = nextPhase(r), auto = flag('uniflow.autoPhase', false)
    const { data, error } = await supabase.from('active_timer').update({
      phase: n.phase, cycle_index: n.cycle_index, phase_target_seconds: n.phase_target_seconds, phase_started_at: endedAt.toISOString(),
      accumulated_seconds: 0, status: auto ? 'running' : 'paused', resumed_at: auto ? endedAt.toISOString() : null,
    }).eq('id', r.id).eq('phase_started_at', r.phase_started_at).select()
    if (error || !data?.length) { await refresh(); return }
    if (recordFocus) await record(r, endedAt, Math.min(elapsedSeconds(r, endedAt), r.phase_target_seconds ?? Infinity))
    await refresh()
  }, [record, refresh])

  useEffect(() => {
    if (!row || row.status !== 'running' || row.phase_target_seconds == null) return
    if (remainingSeconds(row, now) !== 0) return
    const key = `${row.id}:${row.phase_started_at}:${row.cycle_index}:${row.phase}`
    if (handled.current === key) return
    handled.current = key
    const end = phaseEndedAt(row) ?? new Date()
    void advance(row, end, true)
    if (flag('uniflow.chime', true)) mixer.chime()
    show(t('study.phaseDone'))
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification('Nook', { body: t('study.phaseDone') }) } catch { /* ignore */ }
  }, [row, now, advance, show, t])

  const startRef = useRef<Promise<void> | null>(null)
  /** Optimistic: the session appears on screen at once (so focus mode can animate in), the server catches up behind it. */
  const start = (a: StartArgs) => {
    const nowIso = new Date().toISOString()
    const fields = { mode: a.mode, phase: 'focus' as const, cycle_index: 0, status: 'running' as const, config: a.config,
      phase_target_seconds: targetFor(a.mode, 'focus', a.config), resumed_at: nowIso, accumulated_seconds: 0, phase_started_at: nowIso, course_id: a.course_id, task_id: a.task_id, goal: a.goal }
    const prev = qc.getQueryData(['active_timer'])
    qc.setQueryData(['active_timer'], [{ ...fields, id: 'pending', user_id: '', created_at: nowIso, updated_at: nowIso, deleted_at: null, is_demo: false } satisfies ActiveTimer])
    setNow(new Date())
    const job = (async () => {
      try {
        const uid = (await supabase.auth.getSession()).data.session?.user.id ?? (await supabase.auth.getUser()).data.user!.id
        await supabase.from('active_timer').delete().eq('user_id', uid)
        const { error } = await supabase.from('active_timer').insert(fields)
        if (error) throw error
        if (a.course_id) safeSet('uniflow.lastCourse', a.course_id)
      } catch (e) { qc.setQueryData(['active_timer'], prev); throw e } finally { startRef.current = null }
      await refresh()
    })()
    startRef.current = job
    return job
  }
  /** The real row id (waits for an optimistic start to land first). */
  const realRow = async () => { if (startRef.current) await startRef.current.catch(() => {}); return (qc.getQueryData<ActiveTimer[]>(['active_timer']) ?? [])[0] }
  const patch = async (p: Record<string, unknown>) => { const r = row?.id === 'pending' ? await realRow() : row; if (!r) return; const { error } = await supabase.from('active_timer').update(p).eq('id', r.id); if (error) throw error; await refresh() }
  const pause = () => { const n = pauseTimer(row!, new Date()); return patch({ status: n.status, accumulated_seconds: n.accumulated_seconds, resumed_at: null }) }
  const resume = () => { const n = resumeTimer(row!, new Date()); return patch({ status: n.status, resumed_at: n.resumed_at }) }
  const skipBreak = () => advance(row!, new Date(), false)
  /** Optimistic: focus mode closes at once; the session is saved and the timer removed in the background. */
  const end = async (save: boolean) => {
    if (!row) return
    const endedAt = new Date(), r0 = row
    qc.setQueryData(['active_timer'], [])
    const r = r0.id === 'pending' ? await realRow() ?? r0 : r0
    if (save && r.phase === 'focus') await record(r, endedAt, elapsedSeconds(r, endedAt))
    if (r.id !== 'pending') await supabase.from('active_timer').delete().eq('id', r.id)
    await refresh()
  }
  const elapsed = row ? elapsedSeconds(row, now) : 0
  const remaining = row ? remainingSeconds(row, now) : null
  return { row, loading: q.isLoading, error: q.error, now, elapsed, remaining, pending, saveError, retrySave, start, pause, resume, skipBreak, stopAndSave: () => end(true), discard: () => end(false) }
}
