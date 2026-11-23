import { DateTime } from 'luxon'

/** Small bar chart in plain HTML: fixed height, day labels, exact values for screen readers. */
export function MiniBars({ data, max, label, unit, highlight }: { data: { d: string; v: number }[]; max: number; label: string; unit: string; highlight?: string }) {
  const top = Math.max(max, ...data.map((x) => x.v), 1)
  return (
    <figure aria-label={label}>
      <div className="flex h-24 items-end gap-1.5" role="list">
        {data.map((x, i) => (
          <div key={x.d} role="listitem" aria-label={`${x.d}: ${x.v} ${unit}`} title={`${x.v} ${unit}`} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
            <div className={`bar-grow w-full max-w-7 rounded-full transition-opacity ${x.d === highlight ? 'bg-primary-strong' : 'bg-primary-strong/45 group-hover:bg-primary-strong/70'}`}
              style={{ height: `${Math.max(4, (x.v / top) * 100)}%`, animationDelay: `${i * 40}ms` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5 text-[10px] text-text-2">{data.map((x) => <span key={x.d} className="flex-1 text-center">{DateTime.fromISO(x.d).toFormat(data.length > 7 ? 'd' : 'ccc')}</span>)}</div>
    </figure>
  )
}
