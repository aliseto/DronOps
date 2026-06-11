/**
 * P0 offline capture queue — storage-agnostic semantics (UX_SYSTEM §10):
 * queued items are visible and individually inspectable; device capture
 * timestamps are preserved through sync; a failed replay NEVER drops the item
 * (it stays queued with the error attached). Conflict policy: P0 queues
 * CREATES only (occurrence quick-file) — edits, which can conflict, stay
 * online-only until the conflict prompt exists (flagged).
 */

export interface QueuedItem<T = Record<string, string>> {
  id: string;
  /** Replay vocabulary key, e.g. "occurrence". */
  kind: string;
  payload: T;
  /** Device capture time (ISO) — preserved through sync ("captured 09:14"). */
  capturedAt: string;
  attempts: number;
  lastError?: string;
}

export interface QueueStore<T = Record<string, string>> {
  load(): Promise<QueuedItem<T>[]>;
  save(items: QueuedItem<T>[]): Promise<void>;
}

export type ReplayHandler<T> = (item: QueuedItem<T>) => Promise<void>;

export class OfflineQueue<T = Record<string, string>> {
  constructor(
    private readonly store: QueueStore<T>,
    private readonly newId: () => string = () => crypto.randomUUID(),
  ) {}

  async enqueue(kind: string, payload: T, capturedAt: Date = new Date()): Promise<QueuedItem<T>> {
    const items = await this.store.load();
    const item: QueuedItem<T> = {
      id: this.newId(),
      kind,
      payload,
      capturedAt: capturedAt.toISOString(),
      attempts: 0,
    };
    await this.store.save([...items, item]);
    return item;
  }

  async list(): Promise<QueuedItem<T>[]> {
    return this.store.load();
  }

  /**
   * Replay FIFO. Successes leave the queue; failures stay (attempts + error)
   * and later items are still attempted — one bad item must not dam the queue.
   */
  async replay(handler: ReplayHandler<T>): Promise<{ synced: number; remaining: QueuedItem<T>[] }> {
    const items = await this.store.load();
    const remaining: QueuedItem<T>[] = [];
    let synced = 0;
    for (const item of items) {
      try {
        await handler(item);
        synced += 1;
      } catch (e) {
        remaining.push({
          ...item,
          attempts: item.attempts + 1,
          lastError: e instanceof Error ? e.message : String(e),
        });
      }
    }
    await this.store.save(remaining);
    return { synced, remaining };
  }
}
