/** Local calendar day as YYYY-MM-DD. */
export function dayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Small stable string hash (FNV-1a, 32 bit). */
function hashString(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Same item for everyone on the same local day, a different one the next day. */
export function pickOfTheDay<T>(pool: readonly T[], date: Date = new Date()): T | undefined {
  if (pool.length === 0) return undefined;
  return pool[hashString(dayKey(date)) % pool.length];
}
