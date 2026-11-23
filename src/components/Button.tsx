import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
const V: Record<Variant, string> = {
  primary: 'bg-primary-strong text-on-primary hover:opacity-90',
  secondary: 'border border-border bg-surface text-text hover:bg-surface-2',
  ghost: 'text-text hover:bg-surface-2',
  danger: 'bg-danger-soft text-text hover:opacity-90',
}
export function Button({ variant = 'primary', className = '', type = 'button', ...p }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button type={type} {...p}
      className={`t-ui inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium md:min-h-10 disabled:opacity-50 ${V[variant]} ${className}`} />
  )
}
