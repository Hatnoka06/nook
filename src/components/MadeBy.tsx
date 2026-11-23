/** Maker's mark. */
export function MadeBy({ className = '' }: { className?: string }) {
  return <p className={`made-by select-none text-[11px] tracking-wide text-text-2 ${className}`}>made by <span className="font-semibold text-text">Kayden Hoang</span></p>
}
