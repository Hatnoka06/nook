export function Segmented<T extends string>({ label, value, options, onChange }:
  { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex gap-1 rounded-full border border-border bg-surface-2 p-1">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
          className={`t-ui min-h-10 rounded-full px-4 text-sm font-medium ${value === o.value ? 'bg-ink text-on-ink' : 'text-text-2 hover:text-text'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
