import i18n, { parseLang, setLanguage } from './i18n'

describe('i18n', () => {
  afterEach(() => setLanguage('en'))
  it('parseLang falls back to en', () => {
    expect(parseLang('fr')).toBe('en'); expect(parseLang(null)).toBe('en'); expect(parseLang('vi')).toBe('vi')
  })
  it('setLanguage switches strings, html lang and storage', () => {
    setLanguage('vi')
    expect(i18n.t('nav.home')).toBe('Trang chủ')
    expect(document.documentElement.lang).toBe('vi')
    expect(localStorage.getItem('uniflow.lang')).toBe('vi')
  })
  it('plural', () => {
    expect(i18n.t('common.daysLeft', { count: 1 })).toBe('1 day left')
    expect(i18n.t('common.daysLeft', { count: 3 })).toBe('3 days left')
  })
})
