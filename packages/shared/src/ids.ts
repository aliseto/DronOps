import { randomUUID } from "node:crypto";

/** UUID v4, used for primary keys generated app-side when needed. */
export const newId = (): string => randomUUID();

/**
 * Human-facing reference numbers (e.g. NCR-2026-019). The numeric counter is
 * allocated by the DB (a counters table / sequence) — this only formats it.
 */
export const formatRef = (prefix: string, year: number, seq: number): string =>
  `${prefix}-${year}-${String(seq).padStart(3, "0")}`;
