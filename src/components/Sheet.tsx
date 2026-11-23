import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Sheet({ open, onOpenChange, title, children }:
  { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content aria-describedby={undefined}
          className="sheet-in surface-solid fixed z-50 border border-border p-5 inset-x-0 bottom-0 rounded-t-card md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-card">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
            <Dialog.Close aria-label={t('common.close')} className="min-h-11 min-w-11 rounded-full hover:bg-surface-2"><X className="mx-auto" size={20} strokeWidth={1.5} /></Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
