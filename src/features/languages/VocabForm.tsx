import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/fields'
import { FormSheet } from '@/components/FormSheet'
import { useTable } from '@/lib/data'
import type { Vocab } from '@/lib/types'

const FIELDS = ['term', 'reading', 'hanviet', 'pos', 'meaning_vi', 'meaning_en', 'example', 'example_reading', 'example_vi', 'example_en', 'notes'] as const
type F = (typeof FIELDS)[number]

export function VocabForm({ language, initial, onClose }: { language: 'zh' | 'es'; initial?: Vocab; onClose: () => void }) {
  const { t } = useTranslation()
  const tbl = useTable<Vocab>('vocab')
  const lang = initial?.language ?? language, zh = lang === 'zh'
  const [v, setV] = useState<Record<F, string>>(() => Object.fromEntries(FIELDS.map((f) => [f, (initial?.[f] as string | null) ?? ''])) as Record<F, string>)
  const [err, setErr] = useState('')
  const label: Record<F, string> = { term: zh ? t('lang.termZh') : t('lang.term'), reading: zh ? t('lang.readingZh') : t('lang.readingEs'), hanviet: t('lang.hanviet'), pos: t('lang.pos'),
    meaning_vi: t('lang.meaningVi'), meaning_en: t('lang.meaningEn'), example: t('lang.example'), example_reading: t('lang.exampleReading'), example_vi: t('lang.exampleVi'), example_en: t('lang.exampleEn'), notes: t('lang.notes') }
  const shown = FIELDS.filter((f) => zh || (f !== 'hanviet' && f !== 'example_reading'))
  const submit = async () => {
    if (!v.term.trim()) { setErr(t('common.required')); return false }
    const row = Object.fromEntries(shown.map((f) => [f, v[f].trim() || null])) as Partial<Vocab>
    if (initial) await tbl.update.mutateAsync({ id: initial.id, patch: row })
    else await tbl.insert.mutateAsync({ ...row, language: lang, box: 0, due_date: null } as Partial<Vocab>)
  }
  return (
    <FormSheet title={initial ? t('lang.edit') : t('lang.add')} onClose={onClose} onSubmit={submit} onDelete={initial ? () => tbl.remove(initial.id) : undefined}>
      {shown.map((f) => <TextField key={f} label={label[f]} lang={['term', 'example'].includes(f) ? lang : undefined} className={zh && ['term', 'example'].includes(f) ? 'hanzi' : ''} value={v[f]} error={f === 'term' ? err : undefined} onChange={(e) => setV({ ...v, [f]: e.target.value })} autoFocus={f === 'term'} />)}
    </FormSheet>
  )
}
