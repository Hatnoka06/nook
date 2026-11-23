import { BookOpenCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'
import { CardHeader } from '@/components/CardHeader'
import { useVocab } from '@/lib/queries'
import { dueCount } from '@/lib/srs'
import { useStudyLang } from '@/lib/studyLang'
import { wordOfDay } from './LanguagesPage'
import { SpeakButton, WordExample, WordHead } from './parts'

/** Dashboard card: today's word in the language you are learning, with its example and how many words are due. */
export function WordOfDayCard({ today }: { today: string }) {
  const { t } = useTranslation()
  const [lang] = useStudyLang()
  const { data } = useVocab()
  const deck = (data ?? []).filter((w) => w.language === lang)
  const w = wordOfDay(deck, today, lang)
  if (!w) return null
  const due = dueCount(deck, today)
  return (
    <Card glass>
      <CardHeader icon={BookOpenCheck} title={t('dash.words')} tint="var(--course-6, #D9822B)" action={<span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-2">{lang === 'zh' ? '中文' : 'Español'}</span>} />
      <div className="flex items-start justify-between gap-2"><WordHead w={w} /><SpeakButton text={w.term} lang={w.language} /></div>
      <div className="mt-3"><WordExample w={w} /></div>
      <Link to="/languages" className="t-ui mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:bg-surface-2"><BookOpenCheck size={16} strokeWidth={1.5} aria-hidden />{due ? t('lang.reviewN', { n: Math.min(20, due) }) : t('lang.review')}</Link>
    </Card>
  )
}
