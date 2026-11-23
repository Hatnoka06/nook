import { render } from '@testing-library/react'
import { Markdown } from './markdown'

const r = (src: string) => render(<Markdown source={src} />).container
describe('Markdown (safe renderer)', () => {
  it('never runs raw HTML: tags are shown as text', () => {
    const c = r('<script>alert(1)</script> <img src=x onerror=alert(1)>')
    expect(c.querySelector('script')).toBeNull(); expect(c.querySelector('img')).toBeNull()
    expect(c.textContent).toContain('<script>alert(1)</script>')
  })
  it('only http(s) and mailto links become anchors', () => {
    const c = r('[ok](https://example.com) [bad](javascript:alert(1))')
    const a = c.querySelectorAll('a')
    expect(a).toHaveLength(1); expect(a[0].getAttribute('href')).toBe('https://example.com'); expect(a[0].getAttribute('rel')).toContain('noopener')
    expect(c.textContent).toContain('bad')
  })
  it('headings, bold, italic, code', () => {
    const c = r('# Title\n\n**b** *i* `c`')
    expect(c.querySelector('h1')?.textContent).toBe('Title'); expect(c.querySelector('strong')?.textContent).toBe('b')
    expect(c.querySelector('em')?.textContent).toBe('i'); expect(c.querySelector('code')?.textContent).toBe('c')
  })
  it('lists and checklists', () => {
    const c = r('- a\n- b\n\n1. x\n2. y\n\n- [x] done\n- [ ] todo')
    expect(c.querySelectorAll('ul').length).toBe(2); expect(c.querySelectorAll('ol li')).toHaveLength(2)
    const boxes = c.querySelectorAll('[role=checkbox]'); expect(boxes).toHaveLength(2)
    expect(boxes[0].getAttribute('aria-checked')).toBe('true'); expect(boxes[1].getAttribute('aria-checked')).toBe('false')
  })
  it('tables', () => {
    const c = r('| a | b |\n|---|---|\n| 1 | 2 |')
    expect(c.querySelectorAll('th')).toHaveLength(2); expect(c.querySelectorAll('td')).toHaveLength(2)
  })
  it('fenced code is literal', () => {
    const c = r('```\n**not bold** <b>x</b>\n```')
    expect(c.querySelector('pre code')?.textContent).toContain('**not bold** <b>x</b>'); expect(c.querySelector('strong')).toBeNull()
  })
})

import { toggleChecklistLine } from './markdown'
describe('checklist toggling', () => {
  it('flips only the chosen line, keeping indentation and bullet', () => {
    const src = '# Todo\n- [ ] one\n  * [x] two\n- plain'
    expect(toggleChecklistLine(src, 1)).toBe('# Todo\n- [x] one\n  * [x] two\n- plain')
    expect(toggleChecklistLine(src, 2)).toBe('# Todo\n- [ ] one\n  * [ ] two\n- plain')
    expect(toggleChecklistLine(src, 3)).toBe(src) // not a checklist line
  })
})
