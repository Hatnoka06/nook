import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <section className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{t('notFound.title')}</h1>
      <Link to="/"><Button>{t('notFound.back')}</Button></Link>
    </section>
  )
}
