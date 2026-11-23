import { WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOnline } from '@/lib/useOnline'

export function OfflineBanner() {
  const { t } = useTranslation()
  if (useOnline()) return null
  return (
    <div role="status" className="surface-solid sticky top-0 z-50 flex items-center justify-center gap-2 border-b border-border px-4 py-2 text-sm">
      <WifiOff size={16} strokeWidth={1.5} aria-hidden />{t('offline.banner')}
    </div>
  )
}
