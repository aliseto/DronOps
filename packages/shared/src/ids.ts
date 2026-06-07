/** UUID v4, used for primary keys generated app-side when needed.
 * Uses the global Web Crypto (Node 20+ and browsers) so the module stays
 * client-bundle-safe. */
export const newId = (): string => crypto.randomUUID();

/**
 * Human-facing reference numbers (e.g. NCR-2026-019). The numeric counter is
 * allocated by the DB (a counters table / sequence) — this only formats it.
 */
export const formatRef = (prefix: string, year: number, seq: number): string =>
  `${prefix}-${year}-${String(seq).padStart(3, "0")}`;
