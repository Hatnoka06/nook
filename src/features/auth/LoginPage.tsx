import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { CheckField, FormError, TextField } from '@/components/fields'
import { Logo } from '@/components/Logo'
import { MadeBy } from '@/components/MadeBy'
import { useOnline } from '@/lib/useOnline'
import { setRemember, supabase } from '@/lib/supabase'
import { useSession } from './AuthProvider'

export function LoginPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const session = useSession()
  const online = useOnline()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRem] = useState(true)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<'in' | 'up'>('in')
  if (session) return <Navigate to="/" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setInfo(''); setBusy(true)
    setRemember(remember)
    if (mode === 'up') {
      const { data, error: err } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/login` } })
      setBusy(false)
      if (err) { setError(t('auth.signUpFailed', { msg: err.message })); return }
      if (data.session) nav('/onboarding', { replace: true }); else { setInfo(t('auth.confirmSent')); setMode('in'); setPassword('') }
      return
    }
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (err) setError(t('auth.badLogin')); else nav('/', { replace: true })
  }
  const forgot = async () => {
    if (!email) return
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/login` })
    setInfo(t('auth.resetSent'))
  }
  return (
    <main className="safe-page relative z-10 mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-1 text-center"><Logo size={44} className="mb-2" /><p className="text-text-2">{t('common.tagline')}</p></div>
      <Card glass>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {error && <FormError>{error}</FormError>}
          {info && <p role="status" className="text-sm text-text-2">{info}</p>}
          <TextField label={t('auth.email')} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label={t('auth.password')} type="password" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} minLength={mode === 'up' ? 8 : undefined} placeholder={mode === 'up' ? t('auth.passwordHint') : undefined} required value={password} onChange={(e) => setPassword(e.target.value)} />
          <CheckField label={t('auth.remember')} checked={remember} onChange={(e) => setRem(e.target.checked)} />
          <Button type="submit" disabled={busy || !online}>{mode === 'up' ? t('auth.signUp') : t('auth.signIn')}</Button>
          {mode === 'in' && <button type="button" onClick={forgot} className="min-h-11 text-sm text-text-2 underline">{t('auth.forgot')}</button>}
          <button type="button" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError(''); setInfo('') }} className="t-ui min-h-11 rounded-full border border-border text-sm font-medium hover:bg-surface-2">{mode === 'in' ? t('auth.noAccount') : t('auth.haveAccount')}</button>
        </form>
      </Card>
      <MadeBy className="text-center" />
    </main>
  )
}
