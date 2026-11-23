import { useTranslation } from 'react-i18next'
import { EmptyState } from './EmptyState'

export function StubPage({ titleKey, emptyKey = 'empty.page', subtitleKey }: { titleKey: string; emptyKey?: string; subtitleKey?: string }) {
  const { t } = useTranslation()
  return (
    <section>
      <h1 className="text-2xl font-bold md:text-[32px]">{t(titleKey)}</h1>
      {subtitleKey && <p className="mt-1 text-text-2">{t(subtitleKey)}</p>}
      <EmptyState title={t(emptyKey)} />
    </section>
  )
}
