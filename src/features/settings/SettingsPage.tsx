import * as Switch from '@radix-ui/react-switch'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { FormError, SelectField, TextField } from '@/components/fields'
import { Logo } from '@/components/Logo'
import { MadeBy } from '@/components/MadeBy'
import { PageHeader } from '@/components/PageHeader'
import { Segmented } from '@/components/Segmented'
import { Sheet } from '@/components/Sheet'
import { useToast } from '@/components/Toast'
import { useProfile } from '@/features/auth/useProfile'
import { deleteAllData, downloadExport } from '@/lib/export'
import { parseLang, setLanguage, type Lang } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import type { ThemePref } from '@/lib/theme'
import { useAppearance } from '@/lib/useAppearance'
import { usePerf, type PerfMode } from '@/lib/perf'
import { useNavHidden } from '@/app/useNavHidden'
import { useOnline } from '@/lib/useOnline'
import { useTheme } from '@/lib/useTheme'
import { clearDemo, seedDemo } from './demo'
import { ScenePicker } from './ScenePicker'
import { WeatherSettings } from './WeatherSettings'

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-medium">{label}</p>{hint && <p className="text-sm text-text-2">{hint}</p>}</div>
      {children}
    </div>
  )
}
const zones = (): string[] => { try { return Intl.supportedValuesOf('timeZone') } catch { return ['Australia/Sydney', 'UTC'] } }
const WIDGETS = ['greeting', 'schedule', 'tasks', 'deadlines', 'study', 'wellbeing', 'words', 'weather']

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const perf = usePerf()
  const [navHidden, setNavHidden] = useNavHidden()
  const { show } = useToast()
  const qc = useQueryClient()
  const online = useOnline()
  const { pref, setPref } = useTheme()
  const { bg, setBg, reduce, setReduce } = useAppearance()
  const { profile, update } = useProfile()
  const [pw, setPw] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [delOpen, setDelOpen] = useState(false)
  const [word, setWord] = useState('')
  const [busy, setBusy] = useState(false)
  const tz = profile?.time_zone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  const save = (patch: Parameters<typeof update>[0]) => { void update(patch).catch(() => show(t('common.loadError'))) }
  const run = async (fn: () => Promise<void>, done: string) => { setBusy(true); try { await fn(); await qc.invalidateQueries(); show(done) } catch (e) { show((e as Error).message) } finally { setBusy(false) } }

  return (
    <section>
      <PageHeader title={t('settings.title')} />
      <Card glass className="divide-y divide-border">
        <Row label={t('settings.language')}>
          <Segmented<Lang> label={t('settings.language')} value={parseLang(i18n.language)} onChange={(l) => { setLanguage(l); save({ language: l }) }}
            options={[{ value: 'en', label: 'English' }, { value: 'vi', label: 'Tiếng Việt' }]} />
        </Row>
        <Row label={t('settings.theme')}>
          <Segmented<ThemePref> label={t('settings.theme')} value={pref} onChange={(p) => { setPref(p); save({ theme: p }) }}
            options={[{ value: 'light', label: t('settings.themeLight') }, { value: 'dark', label: t('settings.themeDark') }, { value: 'system', label: t('settings.themeSystem') }]} />
        </Row>
        <div className="py-3"><p className="font-medium">{t('settings.scene')}</p><p className="text-sm text-text-2">{t('settings.sceneHint')}</p>
          <ScenePicker value={bg} onChange={(b) => { setBg(b); save({ background_id: b }) }} /></div>
        <Row label={t('settings.menu')}>
          <Segmented<'bar' | 'bubble'> label={t('settings.menu')} value={navHidden ? 'bubble' : 'bar'} onChange={(v) => setNavHidden(v === 'bubble')}
            options={[{ value: 'bar', label: t('settings.menuBar') }, { value: 'bubble', label: t('settings.menuBubble') }]} />
        </Row>
        <Row label={t('settings.perf')} hint={t('settings.perfHint')}>
          <Segmented<PerfMode> label={t('settings.perf')} value={perf.mode} onChange={perf.setMode}
            options={[{ value: 'auto', label: t('settings.perfAuto') }, { value: 'high', label: t('settings.perfHigh') }, { value: 'balanced', label: t('settings.perfBalanced') }, { value: 'light', label: t('settings.perfLight') }]} />
        </Row>
        <Row label={t('settings.reduceEffects')} hint={t('settings.reduceEffectsHint')}>
          <Switch.Root checked={reduce} onCheckedChange={(v) => { setReduce(v); save({ reduce_effects: v }) }} aria-label={t('settings.reduceEffects')}
            className="t-ui relative h-7 w-12 shrink-0 rounded-full border border-border bg-surface-2 data-[state=checked]:bg-primary-strong">
            <Switch.Thumb className="t-ui block h-5 w-5 translate-x-1 rounded-full bg-text-2 data-[state=checked]:translate-x-6 data-[state=checked]:bg-on-primary" />
          </Switch.Root>
        </Row>
        <div className="grid gap-3 py-3 sm:grid-cols-3">
          <SelectField label={t('settings.tz')} value={tz} onChange={(e) => save({ time_zone: e.target.value })} options={zones().map((z) => ({ value: z, label: z }))} />
          <SelectField label={t('settings.weekStart')} value={String(profile?.week_starts_on ?? 1)} onChange={(e) => save({ week_starts_on: Number(e.target.value) as 0 | 1 })} options={[{ value: '1', label: t('settings.monday') }, { value: '0', label: t('settings.sunday') }]} />
          <TextField label={t('settings.goal')} type="number" inputMode="numeric" defaultValue={profile?.daily_study_goal_minutes ?? 120} onBlur={(e) => { const n = Number(e.target.value); if (n >= 0 && n <= 1440) save({ daily_study_goal_minutes: n }) }} />
        </div>
        <WeatherSettings />
        <div className="py-3"><p className="mb-1 font-medium">{t('settings.widgets')}</p>
          {WIDGETS.map((w) => (
            <div key={w} className="flex min-h-11 items-center justify-between"><span className="text-sm">{t(`settings.w_${w}`)}</span>
              <Switch.Root checked={profile?.widget_visibility?.[w] !== false} aria-label={t(`settings.w_${w}`)} onCheckedChange={(v) => save({ widget_visibility: { ...(profile?.widget_visibility ?? {}), [w]: v } })}
                className="t-ui relative h-7 w-12 shrink-0 rounded-full border border-border bg-surface-2 data-[state=checked]:bg-primary-strong">
                <Switch.Thumb className="t-ui block h-5 w-5 translate-x-1 rounded-full bg-text-2 data-[state=checked]:translate-x-6 data-[state=checked]:bg-on-primary" /></Switch.Root></div>))}
        </div>
        <Row label={t('settings.demo')}>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={busy || !online} onClick={() => void run(() => seedDemo(tz), t('settings.demoLoaded'))}>{t('settings.loadDemo')}</Button>
            <Button variant="secondary" disabled={busy || !online} onClick={() => void run(clearDemo, t('settings.demoCleared'))}>{t('settings.clearDemo')}</Button>
          </div>
        </Row>
        <div className="flex flex-col gap-3 py-3"><p className="font-medium">{t('settings.account')}</p>
          {pwErr && <FormError>{pwErr}</FormError>}
          <form className="flex items-end gap-2" onSubmit={async (e) => { e.preventDefault(); setPwErr(''); if (pw.length < 8) { setPwErr(t('settings.passwordShort')); return }
            const { error } = await supabase.auth.updateUser({ password: pw }); if (error) setPwErr(error.message); else { setPw(''); show(t('settings.passwordChanged')) } }}>
            <div className="flex-1"><TextField label={t('settings.newPassword')} type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            <Button type="submit" variant="secondary" disabled={!online}>{t('settings.changePassword')}</Button>
          </form>
          <div><Button variant="ghost" onClick={async () => { await supabase.auth.signOut(); qc.clear() }}>{t('settings.signOut')}</Button></div>
        </div>
        <Row label={t('settings.data')}>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={busy || !online} onClick={() => void run(() => downloadExport(tz), t('settings.exported'))}>{t('settings.export')}</Button>
            <Button variant="danger" disabled={busy || !online} onClick={() => { setWord(''); setDelOpen(true) }}>{t('settings.deleteAll')}</Button>
          </div>
        </Row>
      </Card>
      <Sheet open={delOpen} onOpenChange={setDelOpen} title={t('settings.deleteTitle')}>
        <p className="mb-3 text-text-2">{t('settings.deleteBody')}</p>
        <TextField label={t('settings.deleteConfirmLabel')} value={word} onChange={(e) => setWord(e.target.value)} />
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" disabled={busy || !online} onClick={() => void run(() => downloadExport(tz), t('settings.exported'))}>{t('settings.export')}</Button>
          <Button variant="danger" disabled={word !== t('settings.deleteWord') || busy || !online} onClick={() => void run(async () => { await deleteAllData(); setDelOpen(false) }, t('settings.deleteDone'))}>{t('settings.deleteAll')}</Button>
        </div>
      </Sheet>
      <div className="mt-8 flex flex-col items-center gap-2 pb-4"><Logo size={22} className="text-text-2" /><MadeBy /></div>
    </section>
  )
}
