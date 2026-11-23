import { BookOpenCheck, Plus, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useForms } from '@/app/FormHost'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { TextField } from '@/components/fields'
import { PageHeader } from '@/components/PageHeader'
import { QueryGuard } from '@/components/QueryGuard'
import { Segmented } from '@/components/Segmented'
import { useVocab, useTz } from '@/lib/queries'
import { dueCount } from '@/lib/srs'
import { safeSet } from '@/lib/storage'
import { useStudyLang } from '@/lib/studyLang'
import { supabase } from '@/lib/supabase'
import { matchesSearch } from '@/lib/text'
import { useToast } from '@/components/Toast'
import { levelProgress, loadBank, nextBatch, type BankWord } from './wordbank'
import { dailyIndex, useToday } from '@/lib/daily'
import type { Vocab } from '@/lib/types'
import { ES_STARTER, ZH_STARTER } from './decks'
import { SpeakButton, WordExample, WordHead } from './parts'
import { Review } from './Review'

/** Today's word: a new one every day, cycling through the whole deck. */
export const wordOfDay = (list: Vocab[], date: string, lang: string) => (list.length ? [...list].sort((a, b) => a.term.localeCompare(b.term) || a.id.localeCompare(b.id))[dailyIndex(date, list.length, 'word-' + lang)] : undefined)

/** Unlock the next batch of built-in words into this deck, due today. Returns how many were added. */
export async function addMore(lang: 'zh' | 'es', today: string, deck: Vocab[]) {
  const bank = await loadBank(lang)
  const rows = nextBatch(bank, new Set(deck.map((w) => w.term))).map(({ level: _l, ...w }) => ({ ...w, language: lang, is_builtin: true, box: 0, due_date: today }))
  if (rows.length) { const { error } = await supabase.from('vocab').insert(rows); if (error) throw error }
  return rows.length
}

export async function addStarter(lang: 'zh' | 'es', today: string) {
  const rows = (lang === 'zh' ? ZH_STARTER : ES_STARTER).map((w) => ({ ...w, language: lang, is_builtin: true, box: 0, due_date: today }))
  const { error } = await supabase.from('vocab').insert(rows); if (error) throw error
}

export function LanguagesPage() {
  const { t } = useTranslation()
  const tz = useTz()
  const forms = useForms()
  const qc = useQueryClient()
  const { show } = useToast()
  const vQ = useVocab()
  const today = useToday(tz)
  const [lang, setLang] = useStudyLang()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState<{ cards: Vocab[]; practice: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const [shown, setShown] = useState(60)
  const deck = useMemo(() => (vQ.data ?? []).filter((w) => w.language === lang), [vQ.data, lang])
  const due = deck.filter((w) => !w.due_date || w.due_date <= today).sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? '') || a.box - b.box)
  useEffect(() => setShown(60), [q, lang])
  const list = deck.filter((w) => matchesSearch(`${w.term} ${w.reading ?? ''} ${w.hanviet ?? ''} ${w.meaning_vi ?? ''} ${w.meaning_en ?? ''}`, q))
  const wod = wordOfDay(deck, today, lang)
  const nextDue = deck.map((w) => w.due_date).filter((d): d is string => !!d && d > today).sort()[0]
  const starter = async () => { setBusy(true); try { await addStarter(lang, today); safeSet(`uniflow.vocabSeeded.${lang}`, 'true'); await qc.invalidateQueries({ queryKey: ['vocab'] }) } finally { setBusy(false) } }
  const switchLang = setLang
  const [bank, setBank] = useState<BankWord[]>([])
  useEffect(() => { let on = true; void loadBank(lang).then((b) => { if (on) setBank(b) }); return () => { on = false } }, [lang])
  const have = useMemo(() => new Set(deck.map((w) => w.term)), [deck])
  const left = bank.filter((w) => !have.has(w.term)).length
  const levels = levelProgress(bank, have)
  const levelName = (l: number) => (lang === 'zh' ? `HSK ${l}` : l === 1 ? 'A1' : 'A2')
  const more = async () => { setBusy(true); try { const n = await addMore(lang, today, deck); await qc.invalidateQueries({ queryKey: ['vocab'] }); if (n) show(t('lang.added', { n })) } finally { setBusy(false) } }

  return (
    <section>
      <PageHeader title={t('lang.title')} subtitle={t('lang.subtitle')} action={<Segmented<'zh' | 'es'> label={t('lang.title')} value={lang} onChange={switchLang} options={[{ value: 'zh', label: '中文' }, { value: 'es', label: 'Español' }]} />} />
      <QueryGuard q={vQ} rows={3}>
        {deck.length === 0 ? (
          <EmptyState title={t('lang.empty')} action={<div className="flex gap-2"><Button disabled={busy} onClick={() => void starter()}>{t('lang.starter')}</Button><Button variant="secondary" onClick={() => forms.open({ kind: 'vocab', language: lang })}>{t('lang.add')}</Button></div>} />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="stagger grid gap-4 md:grid-cols-[1.4fr_1fr]">
              {wod && (
                <Card glass className="relative overflow-hidden">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-text-2">{t('lang.wordOfDay')}</p>
                  <div className="flex items-start justify-between gap-3"><WordHead w={wod} big /><SpeakButton text={wod.term} lang={wod.language} size={20} /></div>
                  <div className="mt-4"><WordExample w={wod} /></div>
                </Card>
              )}
              <Card glass className="flex flex-col justify-between gap-4">
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-surface-2 px-3 py-1">{t('lang.total', { n: deck.length })}</span>
                  <span className="rounded-full bg-surface-2 px-3 py-1">{t('lang.learned', { n: deck.filter((w) => w.box >= 3).length })}</span>
                </div>
                <div>
                  <p className="tnum text-5xl font-bold">{dueCount(deck, today)}</p>
                  <p className="text-text-2">{due.length ? t('lang.due', { n: dueCount(deck, today) }) : t('lang.caughtUp', { when: nextDue ?? '—' })}</p>
                  <p className="mt-2 text-xs text-text-2">{t('lang.howTo')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {due.length > 0
                    ? <Button onClick={() => setReviewing({ cards: due.slice(0, 20), practice: false })}><BookOpenCheck size={18} strokeWidth={1.5} aria-hidden />{t('lang.reviewN', { n: Math.min(20, due.length) })}</Button>
                    : <Button onClick={() => setReviewing({ cards: [...deck].sort(() => Math.random() - 0.5).slice(0, 20), practice: true })}><BookOpenCheck size={18} strokeWidth={1.5} aria-hidden />{t('lang.practice')}</Button>}
                  <Button variant="secondary" onClick={() => forms.open({ kind: 'vocab', language: lang })}><Plus size={18} strokeWidth={1.5} aria-hidden />{t('lang.add')}</Button>
                  {left > 0 && <Button variant="secondary" disabled={busy} onClick={() => void more()}><Sparkles size={18} strokeWidth={1.5} aria-hidden />{t('lang.learnMore', { n: Math.min(20, left) })}</Button>}
                </div>
                {levels.length > 0 && <div className="flex flex-col gap-2">{levels.map((l) => (
                  <div key={l.level} className="flex items-center gap-3 text-xs">
                    <span className="w-12 shrink-0 font-semibold">{levelName(l.level)}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary-strong transition-[width] duration-700" style={{ width: `${(l.have / l.total) * 100}%` }} /></div>
                    <span className="tnum shrink-0 text-text-2">{t('lang.levelOf', { have: l.have, total: l.total })}</span>
                  </div>))}</div>}
                {bank.length > 0 && left === 0 && <p className="text-xs text-text-2">{t('lang.bankDone')}</p>}
              </Card>
            </div>
            <TextField label={t('common.search')} placeholder={t('lang.search')} value={q} onChange={(e) => setQ(e.target.value)} />
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {list.slice(0, shown).map((w) => (
                <li key={w.id}>
                  <Card className="lift cursor-pointer" onClick={() => setOpen(open === w.id ? null : w.id)}>
                    <div className="flex items-start justify-between gap-2"><WordHead w={w} /><SpeakButton text={w.term} lang={w.language} /></div>
                    <div className="mt-2 flex items-center gap-1" aria-label={`box ${w.box}`}>{[0, 1, 2, 3, 4, 5].map((b) => <span key={b} className={`h-1 flex-1 rounded-full ${b < w.box ? 'bg-primary-strong' : 'bg-surface-2'}`} />)}</div>
                    {open === w.id && <div className="pop-in mt-3 flex flex-col gap-2"><WordExample w={w} />{w.notes && <p className="text-sm text-text-2">{w.notes}</p>}
                      <Button variant="ghost" onClick={(e) => { e.stopPropagation(); forms.open({ kind: 'vocab', language: lang, initial: w }) }}>{t('common.edit')}</Button></div>}
                  </Card>
                </li>))}
            </ul>
            {list.length > shown && <Button variant="secondary" className="self-center" onClick={() => setShown(shown + 60)}>{t('lang.showMore', { n: list.length - shown })}</Button>}
          </div>
        )}
      </QueryGuard>
      {reviewing && <Review cards={reviewing.cards} practice={reviewing.practice} today={today} onClose={() => setReviewing(null)} moreLabel={left > 0 ? t('lang.learnMore', { n: Math.min(20, left) }) : undefined} onMore={async () => { await more(); setReviewing(null) }} />}
    </section>
  )
}
