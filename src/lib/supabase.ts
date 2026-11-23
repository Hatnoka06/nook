import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const isConfigured = Boolean(url && key)

const REMEMBER_KEY = 'uniflow.remember'
export const setRemember = (v: boolean) => { try { localStorage.setItem(REMEMBER_KEY, String(v)) } catch { /* ignore */ } }
const store = () => { try { return localStorage.getItem(REMEMBER_KEY) === 'false' ? sessionStorage : localStorage } catch { return localStorage } }
const storage = {
  getItem: (k: string) => { try { return store().getItem(k) } catch { return null } },
  setItem: (k: string, v: string) => { try { store().setItem(k, v) } catch { /* ignore */ } },
  removeItem: (k: string) => { try { localStorage.removeItem(k); sessionStorage.removeItem(k) } catch { /* ignore */ } },
}

export const supabase: SupabaseClient = createClient(url ?? 'http://localhost', key ?? 'missing', {
  auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
