import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SpeakButton } from '@/features/languages/parts'
import { quoteFor } from '@/lib/quotes'
import { useStudyLang } from '@/lib/studyLang'
import { useToday } from '@/lib/daily'

/** Quote of the day in the language you are learning (Chinese with pinyin, or Spanish), translated into your app language. */
export function QuoteOfDay({ tz, quiet = false }: { tz: string; quiet?: boolean }) {
  const { t, i18n } = useTranslation()
  const [lang] = useStudyLang()
  const [offset, setOffset] = useState(0)
  const today = useToday(tz)
  const q = quoteFor(today, offset)
  useEffect(() => setOffset(0), [today])
  const target = lang === 'zh' ? q.zh : q.es
  const translation = i18n.language === 'vi' ? q.vi : q.en
  return (
    <figure key={`${offset}-${lang}`} className={`quote-in ${quiet ? 'max-w-2xl text-center' : ''}`}>
      <div className={`flex items-start gap-1 ${quiet ? 'justify-center' : ''}`}>
        <blockquote lang={lang} className={`${lang === 'zh' ? 'hanzi' : 'italic'} ${quiet ? 'text-2xl md:text-3xl' : 'text-xl'} font-medium leading-snug`}>{target}</blockquote>
        {!quiet && <SpeakButton text={target} lang={lang} size={16} />}
      </div>
      {lang === 'zh' && <p className={`mt-1 text-text-2 ${quiet ? 'text-base' : 'text-sm'}`}>{q.py}</p>}
      <p className={`mt-1 italic text-text-2 ${quiet ? 'text-base' : 'text-sm'}`}>“{translation}”</p>
      <figcaption className={`mt-1 flex items-center gap-2 text-xs text-text-2 ${quiet ? 'justify-center' : ''}`}>— {q.by}
        {!quiet && <button aria-label={t('quote.another')} title={t('quote.another')} onClick={() => setOffset(offset + 1)} className="t-ui inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-2"><RefreshCw size={13} strokeWidth={1.5} /></button>}</figcaption>
    </figure>
  )
}
