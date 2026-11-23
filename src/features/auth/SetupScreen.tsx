import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'

export function SetupScreen() {
  const { t } = useTranslation()
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4">
      <Card><h1 className="mb-2 text-xl font-bold">{t('auth.setup')}</h1><p className="text-text-2">{t('auth.setupBody')}</p></Card>
    </main>
  )
}
