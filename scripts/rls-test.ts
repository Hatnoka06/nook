/**
 * Proves an anonymous (not signed-in) client sees nothing and cannot sign up.
 *   SUPABASE_URL=… SUPABASE_ANON_KEY=… npx tsx scripts/rls-test.ts
 * Needs a real Supabase project. Run it after applying supabase/migrations.
 */
import { createClient } from '@supabase/supabase-js'
import { TABLES } from '../src/lib/tables'

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) { console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY'); process.exit(1) }
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })

let failed = 0
for (const table of [...TABLES, 'profiles']) {
  const { data, error } = await db.from(table).select('*').limit(5)
  const ok = Boolean(error) || (data ?? []).length === 0
  console.log(`${ok ? 'PASS' : 'FAIL'}  anon select ${table}${error ? ` (denied: ${error.code})` : ' (0 rows)'}`)
  if (!ok) failed++
}
const { error: signupError } = await db.auth.signUp({ email: `rls-probe-${Date.now()}@example.com`, password: 'Probe-pass-12345' })
console.log(`${signupError ? 'PASS' : 'FAIL'}  public sign-up is rejected${signupError ? ` (${signupError.message})` : ''}`)
if (!signupError) failed++
console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed')
process.exit(failed ? 1 : 0)
