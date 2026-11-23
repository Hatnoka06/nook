import { RotateCcw, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'
import { useTable } from '@/lib/data'
import { INTERVALS, review, type Grade } from '@/lib/srs'
import { speak } from '@/lib/speech'
import type { Vocab } from '@/lib/types'
import { SpeakButton, WordExample, WordHead } from './parts'

const GRADES: Grade[] = ['again', 'hard', 'good', 'easy']
const TONE: Record<Grade, string> = {
  again: 'border-[color-mix(in_srgb,#D2564B_45%,transparent)] hover:bg-[color-mix(in_srgb,#D2564B_12%,transparent)]',
  hard: 'border-[color-mix(in_srgb,#D9822B_45%,transparent)] hover:bg-[color-mix(in_srgb,#D9822B_12%,transparent)]',
  good: 'border-primary-strong bg-primary-strong text-on-primary hover:brightness-110',
  easy: 'border-[color-mix(in_srgb,#4E9F8E_45%,transparent)] hover:bg-[color-mix(in_srgb,#4E9F8E_12%,transparent)]',
}

/** Full-screen flashcards. Flip a card, rate how well you knew it; "again" cards come back at the end.
 *  `practice` runs the same deck without touching the schedule. */
export function Review({ cards, today, onClose, practice = false, moreLabel, onMore }: { cards: Vocab[]; today: string; onClose: () => void; practice?: boolean; moreLabel?: string; onMore?: () => Promise<void> }) {
  const { t } = useTranslation()
  const tbl = useTable<Vocab>('vocab')
  const [queue, setQueue] = useState(cards)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(0)
  const card = queue[0]
  const grades = useMemo(() => (card ? GRADES.map((g) => ({ g, ...review(card.box, g, today) })) : []), [card, today])
  const flip = () => { if (!card) return; if (!flipped) speak(card.term, card.language); setFlipped((f) => !f) }

  const grade = (g: Grade) => {
    if (!card || !flipped) return
    if (!practice) { const r = review(card.box, g, today); void tbl.update.mutateAsync({ id: card.id, patch: { box: r.box, due_date: r.due, last_reviewed_at: new Date().toISOString(), reviews: card.reviews + 1 } }) }
    setFlipped(false); setDone((n) => n + 1)
    setQueue((q) => (g === 'again' ? [...q.slice(1), { ...card, box: 0 }] : q.slice(1)))
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip() }
      else if (['1', '2', '3', '4'].includes(e.key)) grade(GRADES[Number(e.key) - 1])
    }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  })
  // full-screen and opaque: hide the page behind it and let the animated scene rest while you review
  useEffect(() => { const o = document.body.style.overflow, el = document.documentElement; document.body.style.overflow = 'hidden'; el.dataset.overlay = 'review'; return () => { document.body.style.overflow = o; delete el.dataset.overlay } }, [])
  const total = cards.length
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={t('lang.review')} className="safe-page fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 overflow-y-auto bg-bg p-4">
      <div className="pop-in flex w-full max-w-lg flex-col gap-4">
        <div className="flex items-center gap-3 text-sm text-text-2">
          <span className="tnum shrink-0">{t('lang.progress', { i: Math.min(done + 1, total), n: total })}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary-strong transition-[width] duration-500" style={{ width: `${(Math.min(done, total) / Math.max(total, 1)) * 100}%` }} /></div>
          <button onClick={onClose} aria-label={t('lang.close')} className="t-ui flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-2"><X size={18} strokeWidth={1.6} /></button>
        </div>
        {practice && <p className="text-center text-xs text-text-2">{t('lang.practiceNote')}</p>}
        {!card ? (
          <div className="surface-solid flex flex-col items-center gap-3 rounded-[28px] border border-border p-10 text-center">
            <p className="text-3xl font-bold">{t('lang.doneTitle')}</p><p className="text-text-2">{practice ? t('lang.practiceDone', { n: done }) : t('lang.doneBody', { n: done })}</p>
            <div className="flex flex-wrap justify-center gap-2">{moreLabel && onMore && <Button onClick={() => void onMore()}>{moreLabel}</Button>}<Button variant={moreLabel ? 'secondary' : 'primary'} onClick={onClose}>{t('lang.close')}</Button></div>
          </div>
        ) : (<>
          <div className="flip-scene" role="button" tabIndex={0} aria-pressed={flipped} onClick={flip}>
            <div className={`flip-card ${flipped ? 'is-flipped' : ''}`}>
              <div className="card-face surface-solid flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-[28px] border border-border p-8 text-center">
                <p lang={card.language} className={`${card.language === 'zh' ? 'hanzi text-7xl' : 'text-5xl'} font-semibold`}>{card.term}</p>
                <p className="flex items-center gap-1.5 text-sm text-text-2"><RotateCcw size={14} strokeWidth={1.6} aria-hidden />{t('lang.tapToFlip')}</p>
              </div>
              <div className="card-face card-back surface-solid flex min-h-[300px] flex-col gap-4 rounded-[28px] border border-border p-6 text-left">
                <div className="flex items-start justify-between gap-2"><WordHead w={card} big /><SpeakButton text={card.term} lang={card.language} /></div>
                <WordExample w={card} />
              </div>
            </div>
          </div>
          {!flipped ? (
            <Button className="w-full" onClick={flip}>{t('lang.flip')}</Button>
          ) : (
            <div className="pop-in flex flex-col gap-2">
              <p className="text-center text-sm font-medium">{t('lang.howWell')}</p>
              <div className="grid grid-cols-4 gap-2">
                {grades.map(({ g, box }, i) => (
                  <button key={g} onClick={() => grade(g)} className={`t-ui flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-card border-2 px-1 text-sm font-semibold ${g === 'good' ? '' : 'bg-surface'} ${TONE[g]}`}>
                    {t(`lang.${g}`)}
                    <span className="text-[11px] font-normal opacity-80">{t(`lang.${g}Hint`)}</span>
                    {!practice && <span className="tnum text-[10px] font-normal opacity-70">{g === 'again' ? t('lang.now') : t('lang.inDays', { count: g === 'hard' ? 1 : INTERVALS[box] })}</span>}
                    <span className="hidden text-[10px] opacity-50 md:inline">{i + 1}</span>
                  </button>))}
              </div>
            </div>
          )}
          <p className="hidden text-center text-xs text-text-2 md:block">{t('lang.keys')}</p>
        </>)}
      </div>
    </div>,
    document.body,
  )
}
