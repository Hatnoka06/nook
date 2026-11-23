export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase()
}
export function matchesSearch(haystack: string, query: string): boolean {
  return normalize(haystack).includes(normalize(query.trim()))
}
