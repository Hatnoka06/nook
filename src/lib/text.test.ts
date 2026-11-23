import { matchesSearch, normalize } from './text'
describe('search normalisation', () => {
  it('strips accents and case', () => {
    expect(normalize('Toán')).toBe('toan'); expect(normalize('Đại học')).toBe('dai hoc')
  })
  it('matches without accents', () => {
    expect(matchesSearch('Toán cao cấp', 'toan')).toBe(true)
    expect(matchesSearch('Toán', 'ly')).toBe(false)
    expect(matchesSearch('anything', '')).toBe(true)
  })
})
