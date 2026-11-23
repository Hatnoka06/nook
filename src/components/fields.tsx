import { AlertCircle } from 'lucide-react'
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const base = 'field-input w-full min-h-11 rounded-input border border-border bg-surface px-3 text-base text-text placeholder:text-text-2'

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children(id)}
      {hint && !error && <p className="text-xs text-text-2">{hint}</p>}
      {error && <p role="alert" className="flex items-center gap-1 text-sm text-text"><AlertCircle size={14} strokeWidth={1.5} aria-hidden />{error}</p>}
    </div>
  )
}
export function TextField({ label, error, hint, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  return <Field label={label} error={error} hint={hint}>{(id) => <input id={id} {...p} className={`${base} ${p.className ?? ''}`} />}</Field>
}
export function TextArea({ label, error, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  return <Field label={label} error={error}>{(id) => <textarea id={id} rows={3} {...p} className={`${base} py-2`} />}</Field>
}
export function SelectField({ label, error, options, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; options: { value: string; label: string }[] }) {
  return (
    <Field label={label} error={error}>
      {(id) => <select id={id} {...p} className={base}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>}
    </Field>
  )
}
export function CheckField({ label, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId()
  return (
    <label htmlFor={id} className="flex min-h-11 items-center gap-3 text-sm">
      <input id={id} type="checkbox" {...p} className="h-5 w-5 accent-[var(--primary-strong)]" />{label}
    </label>
  )
}
export function FormError({ children }: { children: ReactNode }) {
  return <p role="alert" className="flex items-center gap-2 rounded-input border border-border bg-danger-soft/40 px-3 py-2 text-sm"><AlertCircle size={16} strokeWidth={1.5} aria-hidden />{children}</p>
}
