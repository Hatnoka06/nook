import { useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useOnline } from '@/lib/useOnline'
import { Button } from './Button'
import { FormError } from './fields'
import { Sheet } from './Sheet'

/** One dialog/sheet per create-or-edit action. Save is disabled offline (nothing is queued silently). */
export function FormSheet({ title, onClose, onSubmit, onDelete, children }:
  { title: string; onClose: () => void; onSubmit: () => Promise<boolean | void>; onDelete?: () => Promise<void>; children: ReactNode }) {
  const { t } = useTranslation()
  const online = useOnline()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const run = async (fn: () => Promise<boolean | void>) => {
    setBusy(true); setError('')
    try { const ok = await fn(); if (ok !== false) onClose() } catch (e) { setError((e as Error).message || t('common.loadError')) } finally { setBusy(false) }
  }
  const submit = (e: FormEvent) => { e.preventDefault(); void run(onSubmit) }
  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose() }} title={title}>
      <form onSubmit={submit} className="flex max-h-[75dvh] flex-col gap-4 overflow-y-auto px-1 pb-1">
        {error && <FormError>{error}</FormError>}
        {!online && <FormError>{t('offline.banner')}</FormError>}
        {children}
        <div className="flex gap-2">
          <Button type="submit" disabled={busy || !online} className="flex-1">{busy ? t('common.saving') : t('common.save')}</Button>
          {onDelete && <Button type="button" variant="danger" disabled={busy || !online} onClick={() => void run(async () => { await onDelete() })}>{t('common.delete')}</Button>}
          <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
        </div>
      </form>
    </Sheet>
  )
}
