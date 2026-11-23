import { QUOTES, quoteFor } from './quotes'

describe('quote of the day', () => {
  it('same quote all day, changes on another day', () => {
    expect(quoteFor('2026-11-21')).toBe(quoteFor('2026-11-21'))
    const week = new Set(['2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25'].map((d) => quoteFor(d).en))
    expect(week.size).toBeGreaterThan(3)
  })
  it('every quote has English, Vietnamese, Chinese with pinyin, Spanish and an author', () => {
    for (const q of QUOTES) {
      for (const f of [q.en, q.vi, q.zh, q.py, q.es, q.by]) expect(f.trim().length).toBeGreaterThan(1)
      expect(/[\u4e00-\u9fff]/.test(q.zh)).toBe(true) // real hanzi
      expect(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(q.py)).toBe(true) // pinyin with tone marks
      expect(/[\u4e00-\u9fff]/.test(q.py)).toBe(false)
    }
  })
  it('offset walks through the list', () => expect(quoteFor('2026-11-21', 1)).not.toBe(quoteFor('2026-11-21')))
})
