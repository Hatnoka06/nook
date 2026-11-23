import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'
import { MORE_ITEMS } from '@/app/nav'

export function MorePage() {
  const { t } = useTranslation()
  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold md:text-[32px]">{t('more.title')}</h1>
      <Card className="flex flex-col p-2 md:p-2">
        {MORE_ITEMS.map((i) => (
          <Link key={i.to} to={i.to} className="t-ui flex min-h-12 items-center gap-3 rounded-input px-3 hover:bg-surface-2">
            <i.icon size={20} strokeWidth={1.5} aria-hidden />
            <span className="flex-1">{t(`nav.${i.key}`)}</span>
            <ChevronRight size={18} strokeWidth={1.5} aria-hidden className="text-text-2" />
          </Link>
        ))}
      </Card>
    </section>
  )
}
