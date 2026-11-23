type Item = { key: string; title: string; start: string; end: string; allDay: boolean }
/** First timed item overlapping [start, end). A warning only; saving is never blocked. */
export function findConflict(start: string, end: string, items: Item[], ignoreKey?: string): Item | undefined {
  return items.find((i) => !i.allDay && i.key !== ignoreKey && i.start < end && start < i.end)
}
