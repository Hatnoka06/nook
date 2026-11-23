import type { ZodType } from 'zod'

/** Validate form values; messages in the schema are i18n keys. */
export function validate<T>(schema: ZodType<T>, values: unknown, t: (k: string) => string):
  { ok: true; data: T } | { ok: false; errors: Record<string, string> } {
  const r = schema.safeParse(values)
  if (r.success) return { ok: true, data: r.data }
  const errors: Record<string, string> = {}
  for (const i of r.error.issues) { const k = String(i.path[0] ?? '_'); if (!errors[k]) errors[k] = t(i.message) }
  return { ok: false, errors }
}
