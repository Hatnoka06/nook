import type { HTMLAttributes } from 'react'
export function Card({ glass, className = '', ...p }: HTMLAttributes<HTMLDivElement> & { glass?: boolean }) {
  return <div {...p} className={`${glass ? 'glass' : 'bg-surface'} rounded-card border border-border p-4 shadow-(--shadow-card) md:p-5 ${className}`} />
}
