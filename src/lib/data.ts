import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/Toast'
import { supabase } from './supabase'
import type { Base } from './types'

/** All live (not soft-deleted) rows of a table. */
export function useRows<T extends Base>(table: string, opts: { order?: string; enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [table],
    enabled: opts.enabled ?? true,
    queryFn: async () => {
      let q = supabase.from(table).select('*').is('deleted_at', null)
      if (opts.order) q = q.order(opts.order, { ascending: true })
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as T[]
    },
  })
}

/** Insert / update / soft-delete (with Undo toast) for one table. */
export function useTable<T extends Base>(table: string) {
  const qc = useQueryClient()
  const { show } = useToast()
  const { t } = useTranslation()
  const refresh = () => qc.invalidateQueries({ queryKey: [table] })

  const insert = useMutation({
    mutationFn: async (row: Partial<T>) => {
      const { data, error } = await supabase.from(table).insert(row as never).select().single()
      if (error) throw error
      return data as T
    },
    onSuccess: refresh,
  })
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<T> }) => {
      const { error } = await supabase.from(table).update(patch as never).eq('id', id)
      if (error) throw error
    },
    onSuccess: refresh,
  })
  const setDeleted = async (id: string, deleted: boolean) => {
    const { error } = await supabase.from(table).update({ deleted_at: deleted ? new Date().toISOString() : null }).eq('id', id)
    if (error) throw error
    await refresh()
  }
  const remove = async (id: string) => {
    await setDeleted(id, true)
    show(t('common.deleted'), { actionLabel: t('common.undo'), onAction: () => void setDeleted(id, false) })
  }
  return { insert, update, remove, setDeleted, refresh }
}

/** Run a Postgres function (soft delete cascades, set_current_semester ...). */
export async function rpc(fn: string, args: Record<string, unknown>) {
  const { error } = await supabase.rpc(fn, args)
  if (error) throw error
}

/** Cascading soft delete through a SQL function, with an Undo toast that restores it. */
export function useCascadeDelete(fn: 'soft_delete_semester' | 'soft_delete_course') {
  const qc = useQueryClient()
  const { show } = useToast()
  const { t } = useTranslation()
  return async (id: string) => {
    await rpc(fn, { p_id: id })
    await qc.invalidateQueries()
    show(t('common.deleted'), { actionLabel: t('common.undo'), onAction: () => void rpc(fn, { p_id: id, p_restore: true }).then(() => qc.invalidateQueries()) })
  }
}
