"use client";

import { OfflineQueue, type QueuedItem, type QueueStore } from "@dronops/shared";

/**
 * Browser-side offline capture queue (PRD: PWA first — service worker +
 * IndexedDB). Occurrence quick-files captured offline land here with the
 * device timestamp and replay automatically when connectivity returns; items
 * are visible/inspectable via the OfflineBanner and never silently dropped.
 */

export type OccurrencePayload = Record<string, string>;

const DB_NAME = "dronops-offline";
const STORE = "queue";

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const idbStore: QueueStore<OccurrencePayload> = {
  async load() {
    const db = await idb();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
      req.onsuccess = () =>
        resolve(
          (req.result as QueuedItem<OccurrencePayload>[]).sort((a, b) =>
            a.capturedAt.localeCompare(b.capturedAt),
          ),
        );
      req.onerror = () => reject(req.error);
    });
  },
  async save(items) {
    const db = await idb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      store.clear();
      for (const item of items) store.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};

export const offlineQueue = new OfflineQueue<OccurrencePayload>(idbStore);

/** Fired after enqueue/replay so the banner refreshes without polling. */
export const QUEUE_EVENT = "dronops:offline-queue";
export const notifyQueueChanged = () => window.dispatchEvent(new Event(QUEUE_EVENT));

export async function enqueueOccurrence(payload: OccurrencePayload): Promise<void> {
  await offlineQueue.enqueue("occurrence", payload, new Date());
  notifyQueueChanged();
}
