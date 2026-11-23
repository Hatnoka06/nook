import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { FormError, SelectField, TextField } from '@/components/fields'
import { Segmented } from '@/components/Segmented'
import { setLanguage, type Lang } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { setThemePref, useTheme } from '@/lib/useTheme'
import { useOnline } from '@/lib/useOnline'
import { useProfile } from './useProfile'
import { useSession } from './AuthProvider'
import { seedDemo } from '@/features/settings/demo'

const zones = (): string[] => { try { return Intl.supportedValuesOf('timeZone') } catch { return ['Australia/Sydney', 'UTC'] } }

export function OnboardingPage() {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const qc = useQueryClient()
  const online = useOnline()
  const { pref } = useTheme()
  const { update } = useProfile()
  const uid = useSession()?.user.id
  const [name, setName] = useState('')
  const [uni, setUni] = useState('')
  const [tz, setTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [semName, setSemName] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const finish = async (demo: boolean) => {
    setBusy(true); setError('')
    try {
      await update({ display_name: name || null, university: uni || null, time_zone: tz, language: i18n.language as Lang, theme: pref, onboarded: true })
      if (demo) await seedDemo(tz)
      else if (semName && start && end) {
        if (end < start) throw new Error(t('common.required'))
        const { error: e } = await supabase.from('semesters').insert({ name: semName, start_date: start, end_date: end, is_current: true, user_id: uid })
        if (e) throw e
      }
      await qc.invalidateQueries()
      nav('/', { replace: true })
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  const submit = (e: FormEvent) => { e.preventDefault(); void finish(false) }

  return (
    <main className="safe-page relative z-10 mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold md:text-[32px]">{t('auth.onboarding')}</h1>
      <p className="mb-4 text-text-2">{t('auth.obHint')}</p>
      <Card glass>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {error && <FormError>{error}</FormError>}
          <Segmented<Lang> label={t('settings.language')} value={i18n.language as Lang} onChange={setLanguage}
            options={[{ value: 'en', label: 'English' }, { value: 'vi', label: 'Tiếng Việt' }]} />
          <Segmented label={t('settings.theme')} value={pref} onChange={setThemePref}
            options={[{ value: 'light', label: t('settings.themeLight') }, { value: 'dark', label: t('settings.themeDark') }, { value: 'system', label: t('settings.themeSystem') }]} />
          <TextField label={t('auth.obName')} value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label={t('auth.obUniversity')} value={uni} onChange={(e) => setUni(e.target.value)} />
          <SelectField label={t('auth.obTimeZone')} value={tz} onChange={(e) => setTz(e.target.value)} options={zones().map((z) => ({ value: z, label: z }))} />
          <fieldset className="flex flex-col gap-3 rounded-input border border-border p-3">
            <legend className="px-1 text-sm font-medium">{t('auth.obSemester')}</legend>
            <TextField label={t('auth.obSemesterName')} value={semName} onChange={(e) => setSemName(e.target.value)} placeholder="Session 2 2026" />
            <div className="grid grid-cols-2 gap-3">
              <TextField label={t('auth.obStart')} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              <TextField label={t('auth.obEnd')} type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </fieldset>
          <Button type="submit" disabled={busy || !online}>{t('auth.obFinish')}</Button>
          <Button variant="secondary" disabled={busy || !online} onClick={() => void finish(true)}>{t('auth.obSkipDemo')}</Button>
        </form>
      </Card>
    </main>
  )
}
