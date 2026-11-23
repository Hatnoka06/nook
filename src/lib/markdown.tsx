import { Fragment, type ReactNode } from 'react'
import { CheckButton } from '@/components/CheckButton'

const SAFE_URL = /^(https?:\/\/|mailto:)/i
const INLINE = /(`[^`\n]+`)|(\[[^\]\n]+\]\([^)\s]+\))|(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*|_[^_\n]+_)/g

/** Inline markup -> React nodes. Everything else stays plain text, so HTML is never interpreted. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0, k = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index! > last) out.push(text.slice(last, m.index))
    const s = m[0]
    if (m[1]) out.push(<code key={k++} className="rounded bg-surface-2 px-1 text-[0.9em]">{s.slice(1, -1)}</code>)
    else if (m[2]) {
      const [, label, url] = s.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!
      out.push(SAFE_URL.test(url) ? <a key={k++} href={url} target="_blank" rel="noopener noreferrer nofollow" className="underline">{label}</a> : label)
    } else if (m[3]) out.push(<strong key={k++}>{s.slice(2, -2)}</strong>)
    else out.push(<em key={k++}>{s.slice(1, -1)}</em>)
    last = m.index! + s.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
/** Flip "- [ ]" ⇄ "- [x]" on one source line (by index); other lines untouched. */
export function toggleChecklistLine(source: string, lineIndex: number): string {
  const lines = source.split('\n'), l = lines[lineIndex]
  const m = l?.match(/^(\s*[-*]\s+\[)( |x|X)(\].*)$/)
  if (!m) return source
  lines[lineIndex] = m[1] + (m[2] === ' ' ? 'x' : ' ') + m[3]
  return lines.join('\n')
}
const cells = (line: string) => line.replace(/^\s*\||\|\s*$/g, '').split('|').map((c) => c.trim())

/** Small, safe Markdown: headings, lists, checklists, quotes, code, tables, bold/italic/links. */
export function Markdown({ source, onToggle }: { source: string; onToggle?: (lineIndex: number) => void }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let i = 0, key = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    if (line.startsWith('```')) {
      const body: string[] = []; i++
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++])
      i++; blocks.push(<pre key={key++} className="my-2 overflow-x-auto rounded-input bg-surface-2 p-3 text-sm"><code>{body.join('\n')}</code></pre>); continue
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) { const L = h[1].length; const cls = ['text-2xl', 'text-xl', 'text-lg'][L - 1] + ' mt-4 mb-1 font-bold'; blocks.push(L === 1 ? <h1 key={key++} className={cls}>{inline(h[2])}</h1> : L === 2 ? <h2 key={key++} className={cls}>{inline(h[2])}</h2> : <h3 key={key++} className={cls}>{inline(h[2])}</h3>); i++; continue }
    if (line.includes('|') && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1] ?? '')) {
      const head = cells(line); i += 2; const rows: string[][] = []
      while (i < lines.length && lines[i].includes('|')) rows.push(cells(lines[i++]))
      blocks.push(<div key={key++} className="my-2 overflow-x-auto"><table className="w-full border-collapse text-sm"><thead><tr>{head.map((c, j) => <th key={j} className="border border-border px-2 py-1 text-left">{inline(c)}</th>)}</tr></thead>
        <tbody>{rows.map((r, a) => <tr key={a}>{r.map((c, j) => <td key={j} className="border border-border px-2 py-1">{inline(c)}</td>)}</tr>)}</tbody></table></div>); continue
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [], at: number[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { at.push(i); items.push(lines[i++].replace(/^\s*[-*]\s+/, '')) }
      blocks.push(<ul key={key++} className="my-2 list-disc pl-6">{items.map((t, j) => { const c = t.match(/^\[( |x|X)\]\s+(.*)$/)
        return c ? <li key={j} className="-ml-7 flex list-none items-center gap-1"><CheckButton size={20} delay={0} checked={c[1] !== ' '} label={c[2]} disabled={!onToggle} onChange={() => onToggle?.(at[j])} /><span className={`task-title ${c[1] !== ' ' ? 'text-text-2 line-through' : ''}`}>{inline(c[2])}</span></li> : <li key={j}>{inline(t)}</li> })}</ul>); continue
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\.\s+/, ''))
      blocks.push(<ol key={key++} className="my-2 list-decimal pl-6">{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ol>); continue
    }
    if (line.startsWith('>')) {
      const q: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) q.push(lines[i++].replace(/^>\s?/, ''))
      blocks.push(<blockquote key={key++} className="my-2 border-l-2 border-border pl-3 text-text-2">{inline(q.join(' '))}</blockquote>); continue
    }
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|```|\s*[-*]\s|\s*\d+\.\s|>)/.test(lines[i])) para.push(lines[i++])
    if (!para.length) { para.push(lines[i++]) }
    blocks.push(<p key={key++} className="my-2">{para.map((p, j) => <Fragment key={j}>{j > 0 && <br />}{inline(p)}</Fragment>)}</p>)
  }
  return <div className="leading-relaxed">{blocks}</div>
}
