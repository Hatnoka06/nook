/**
 * Restore an UniFlow JSON export into a (possibly empty) Supabase project.
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... TARGET_USER_ID=<auth user uuid> npx tsx scripts/restore.ts uniflow-export-2026-11-21.json
 * The service_role key stays on your machine. Never put it in .env of the app or in git.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { TABLES } from '../src/lib/tables'

const [file] = process.argv.slice(2)
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TARGET_USER_ID } = process.env
if (!file || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TARGET_USER_ID) {
  console.error('Usage: SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… TARGET_USER_ID=… npx tsx scripts/restore.ts <export.json>')
  process.exit(1)
}
const dump = JSON.parse(readFileSync(file, 'utf8'))
if (typeof dump.schema_version !== 'number' || dump.schema_version < 1) { console.error('Unsupported or missing schema_version'); process.exit(1) }
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

async function main() {
  if (dump.profile) {
    const { error } = await db.from('profiles').upsert({ ...dump.profile, id: TARGET_USER_ID }, { onConflict: 'id' })
    if (error) throw error
    console.log('profile restored')
  }
  for (const table of TABLES) {
    const rows: Record<string, unknown>[] = (dump.tables?.[table] ?? []).map((r: Record<string, unknown>) => ({ ...r, user_id: TARGET_USER_ID }))
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await db.from(table).upsert(rows.slice(i, i + 500), { onConflict: 'id' })
      if (error) throw new Error(`${table}: ${error.message}`)
    }
    console.log(`${table}: ${rows.length} rows`)
  }
  console.log('Restore complete.')
}
main().catch((e) => { console.error(e); process.exit(1) })
