import { Volume2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/Toast'
import { speak } from '@/lib/speech'
import type { Vocab } from '@/lib/types'

export function SpeakButton({ text, lang, size = 18 }: { text: string; lang: 'zh' | 'es'; size?: number }) {
  const { t } = useTranslation()
  const { show } = useToast()
  return (
    <button type="button" aria-label={`${t('lang.listen')}: ${text}`} title={t('lang.listen')} onClick={(e) => { e.stopPropagation(); if (!speak(text, lang)) show(t('lang.noVoice')) }}
      className="t-ui inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-2 hover:bg-surface-2 hover:text-text"><Volume2 size={size} strokeWidth={1.5} /></button>
  )
}
/** The core of a word: big term, pronunciation, Hán Việt, meaning. */
export function WordHead({ w, big = false }: { w: Vocab; big?: boolean }) {
  const { i18n } = useTranslation()
  const meaning = i18n.language === 'vi' ? (w.meaning_vi || w.meaning_en) : (w.meaning_en || w.meaning_vi)
  const zh = w.language === 'zh'
  return (
    <div className="min-w-0">
      <p lang={w.language} className={`${zh ? 'hanzi' : ''} font-semibold leading-tight ${big ? (zh ? 'text-6xl' : 'text-4xl') : (zh ? 'text-3xl' : 'text-xl')}`}>{w.term}</p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-text-2">
        {w.reading && <span className={zh ? 'text-base' : 'font-mono text-sm'}>{w.reading}</span>}
        {w.hanviet && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs uppercase tracking-wider">{w.hanviet}</span>}
        {w.pos && <span className="text-xs italic">{w.pos}</span>}
      </p>
      {meaning && <p className={big ? 'mt-2 text-lg' : 'mt-1'}>{meaning}</p>}
    </div>
  )
}
export function WordExample({ w }: { w: Vocab }) {
  const { i18n } = useTranslation()
  if (!w.example) return null
  const tr = i18n.language === 'vi' ? (w.example_vi || w.example_en) : (w.example_en || w.example_vi)
  return (
    <div className="flex items-start gap-1 rounded-input bg-surface-2/70 p-3">
      <div className="min-w-0 flex-1">
        <p lang={w.language} className={w.language === 'zh' ? 'hanzi text-lg' : 'text-base'}>{w.example}</p>
        {w.example_reading && <p className="text-sm text-text-2">{w.example_reading}</p>}
        {tr && <p className="text-sm text-text-2">{tr}</p>}
      </div>
      <SpeakButton text={w.example} lang={w.language} size={16} />
    </div>
  )
}
