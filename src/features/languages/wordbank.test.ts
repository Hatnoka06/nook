import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { ES_STARTER, ZH_STARTER } from './decks'
import { ES_BANK, ZH_BANK, levelProgress, loadBank, mergeBank, nextBatch } from './wordbank'

const zhRows = JSON.parse(readFileSync('public/vocab/zh-hsk.json', 'utf8'))
const esRows = JSON.parse(readFileSync('public/vocab/es-cefr.json', 'utf8'))

describe('word bank', () => {
  it('curated words have examples and do not repeat the starter decks', () => {
    for (const [bank, starter] of [[ZH_BANK, ZH_STARTER], [ES_BANK, ES_STARTER]] as const) {
      const terms = bank.map((w) => w.term)
      expect(new Set(terms).size).toBe(terms.length)
      for (const s of starter) expect(terms).not.toContain(s.term)
      for (const w of bank) for (const f of [w.meaning_en, w.meaning_vi, w.example]) expect((f ?? '').trim().length).toBeGreaterThan(0)
    }
  })
  it('covers HSK 3.0 bands 1–2 in full, with pinyin, Hán Việt, English and Vietnamese', () => {
    expect(zhRows.filter((r: unknown[]) => r[6] === 1).length).toBe(506)
    expect(zhRows.filter((r: unknown[]) => r[6] === 2).length).toBe(750)
    for (const r of zhRows) { expect(/[一-鿿]/.test(r[0])).toBe(true); for (const i of [1, 2, 4, 5]) expect(String(r[i]).trim().length).toBeGreaterThan(0) }
  })
  it('has A1 and A2 Spanish with English and Vietnamese', () => {
    expect(esRows.length).toBeGreaterThan(700)
    expect(new Set(esRows.map((r: unknown[]) => r[6]))).toEqual(new Set([1, 2]))
    for (const r of esRows) for (const i of [0, 4, 5]) expect(String(r[i]).trim().length).toBeGreaterThan(0)
  })
  it('hands out level 1 before level 2, 20 at a time, never repeating', () => {
    const bank = mergeBank(ZH_BANK, zhRows), have = new Set(ZH_STARTER.map((w) => w.term))
    expect(new Set(bank.map((w) => w.term)).size).toBe(bank.length)
    const a = nextBatch(bank, have); expect(a).toHaveLength(20); expect(a.every((w) => w.level === 1)).toBe(true)
    a.forEach((w) => have.add(w.term))
    expect(nextBatch(bank, have).some((w) => a.includes(w))).toBe(false)
    const p = levelProgress(bank, have); expect(p[0].level).toBe(1); expect(p[0].have).toBeGreaterThan(20)
    bank.forEach((w) => have.add(w.term)); expect(nextBatch(bank, have)).toHaveLength(0)
  })
  it('falls back to the curated words when the list cannot be fetched', async () => {
    const bank = await loadBank('es', () => Promise.reject(new Error('offline')))
    expect(bank.length).toBe(ES_BANK.length)
  })
})
