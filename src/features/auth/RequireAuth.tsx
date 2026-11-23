import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { rpc } from '@/lib/data'
import { syncRecurring } from '@/lib/financeSync'
import { useQueryClient } from '@tanstack/react-query'
import { setLanguage } from '@/lib/i18n'
import { safeGet, safeSet } from '@/lib/storage'
import { todayISO } from '@/lib/time'
import { useAppearance } from '@/lib/useAppearance'
import { setThemePref } from '@/lib/useTheme'
import { Button } from '@/components/Button'
import { useSession } from './AuthProvider'
import { useProfile } from './useProfile'

/** Applies account-level display settings once the profile is loaded. */
function ProfileSync() {
  const { profile } = useProfile()
  const { setBg, setReduce } = useAppearance()
  const qc = useQueryClient()
  useEffect(() => {
    if (!profile) return
    setLanguage(profile.language)
    setThemePref(profile.theme)
    setBg(profile.background_id)
    setReduce(profile.reduce_effects)
  }, [profile?.language, profile?.theme, profile?.background_id, profile?.reduce_effects]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!profile) return
    void syncRecurring(todayISO(profile.time_zone)).then((n) => { if (n) void qc.invalidateQueries({ queryKey: ['transactions'] }) }).catch(() => {})
    const day = todayISO(profile.time_zone)
    if (safeGet('uniflow.lastPurge') === day) return
    safeSet('uniflow.lastPurge', day)
    void rpc('purge_deleted', {}).catch(() => safeSet('uniflow.lastPurge', ''))
  }, [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export function RequireAuth({ requireOnboarded = true }: { requireOnboarded?: boolean }) {
  const session = useSession()
  const { profile, isLoading, error } = useProfile()
  const loc = useLocation()
  const { t } = useTranslation()
  if (session === undefined || (session && isLoading)) return <p className="p-8 text-text-2">{t('common.loading')}</p>
  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (error) return <div role="alert" className="flex flex-col items-center gap-3 p-8"><p>{t('common.loadError')}</p><p className="text-sm text-text-2">{(error as { message?: string }).message}</p><Button onClick={() => location.reload()}>{t('common.retry')}</Button></div>
  if (requireOnboarded && profile && !profile.onboarded && loc.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  return <><ProfileSync /><Outlet /></>
}
