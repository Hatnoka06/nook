import { supabase } from './supabase'
import { SCHEMA_VERSION, TABLES } from './tables'
import { todayISO } from './time'

export function buildExport(tables: Record<string, unknown[]>, profile: unknown, tz: string, now: Date = new Date()) {
  const all: Record<string, unknown[]> = {}
  for (const t of TABLES) all[t] = tables[t] ?? []
  return { schema_version: SCHEMA_VERSION, exported_at: now.toISOString(), time_zone: tz, profile, tables: all }
}
export const exportFileName = (now: Date, tz: string) => `uniflow-export-${todayISO(tz, now)}.json`

/** Fetch every table (soft-deleted rows excluded) and trigger a JSON download. */
export async function downloadExport(tz: string): Promise<void> {
  const tables: Record<string, unknown[]> = {}
  for (const t of TABLES) {
    const { data, error } = await supabase.from(t).select('*').is('deleted_at', null)
    if (error) throw error
    tables[t] = data ?? []
  }
  const { data: profile } = await supabase.from('profiles').select('*').maybeSingle()
  const now = new Date()
  const blob = new Blob([JSON.stringify(buildExport(tables, profile, tz, now), null, 2)], { type: 'application/json' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = exportFileName(now, tz); a.click(); URL.revokeObjectURL(a.href)
}

/** Hard-delete all of the user's data (children first). The account itself stays. */
export async function deleteAllData(): Promise<void> {
  for (const t of [...TABLES].reverse()) { const { error } = await supabase.from(t).delete().not('id', 'is', null); if (error) throw error }
}
