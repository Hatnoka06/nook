import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/Toast'

/** Offers a reload when a new service worker is waiting; never reloads by itself. */
export function UpdateToast() {
  const { t } = useTranslation()
  const { show } = useToast()
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  useEffect(() => {
    if (!needRefresh) return
    show(t('update.available'), { actionLabel: t('update.reload'), onAction: () => void updateServiceWorker(true), durationMs: 60000 })
  }, [needRefresh, show, t, updateServiceWorker])
  return null
}
