import { supabase } from './supabase'
import { materializeRecurring } from './finance'
import type { Recurring } from './types'

/** Creates real transactions for repeating rules that are due. Runs when the app opens (no background jobs). */
export async function syncRecurring(today: string): Promise<number> {
  const { data, error } = await supabase.from('recurring_transactions').select('*').is('deleted_at', null).lte('next_date', today)
  if (error || !data) return 0
  let made = 0
  for (const rule of data as Recurring[]) {
    const { dates, next } = materializeRecurring(rule, today)
    if (!dates.length) continue
    // Claim the rule first (guarded on the old next_date) so two devices never both create the same rows.
    const { data: claimed } = await supabase.from('recurring_transactions').update({ next_date: next }).eq('id', rule.id).eq('next_date', rule.next_date).select()
    if (!claimed?.length) continue
    const rows = dates.map((date) => ({ date, amount_cents: rule.amount_cents, type: rule.type, category_id: rule.category_id, note: rule.title || null, recurring_id: rule.id }))
    const { error: e2 } = await supabase.from('transactions').insert(rows)
    if (e2) await supabase.from('recurring_transactions').update({ next_date: rule.next_date }).eq('id', rule.id) // roll back so it retries
    else made += rows.length
  }
  return made
}
