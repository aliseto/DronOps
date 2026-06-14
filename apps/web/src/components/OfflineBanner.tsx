"use client";

import { useCallback, useEffect, useState } from "react";
import type { QueuedItem } from "@dronops/shared";
import { fileOccurrenceAction } from "@/app/(app)/safety/actions";
import {
  notifyQueueChanged,
  offlineQueue,
  QUEUE_EVENT,
  type OccurrencePayload,
} from "@/lib/offline/occurrence-queue";

/**
 * Offline mode banner (UX_SYSTEM §10): states the mode plainly, shows the
 * queue count, and makes queued items individually inspectable. Replays
 * automatically when connectivity returns; failed items stay queued with
 * their error shown — never silently dropped. §15 test hook:
 * data-testid offline-banner / offline-queue.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [items, setItems] = useState<QueuedItem<OccurrencePayload>[]>([]);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(() => {
    offlineQueue
      .list()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const replay = useCallback(async () => {
    const { synced } = await offlineQueue.replay(async (item) => {
      const fd = new FormData();
      for (const [k, v] of Object.entries(item.payload)) fd.set(k, v);
      // Device capture timestamp preserved through sync (UX §10).
      fd.set("reportedAt", item.capturedAt);
      await fileOccurrenceAction(fd);
    });
    if (synced > 0) notifyQueueChanged();
    refresh();
  }, [refresh]);

  useEffect(() => {
    setOnline(navigator.onLine);
    refresh();
    const onOnline = () => {
      setOnline(true);
      void replay();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener(QUEUE_EVENT, refresh);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener(QUEUE_EVENT, refresh);
    };
  }, [refresh, replay]);

  if (online && items.length === 0) return null;

  const label = online
    ? `Syncing — ${items.length} item${items.length === 1 ? "" : "s"} queued`
    : `Offline — ${items.length} item${items.length === 1 ? "" : "s"} queued, will sync automatically`;

  return (
    <div
      data-testid="offline-banner"
      className="border-b border-subtle bg-status-warn-bg px-6 py-2 text-small text-status-warn-fg"
    >
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        {items.length > 0 && (
          <button type="button" className="underline" onClick={() => setOpen((v) => !v)}>
            {open ? "Hide queue" : "View queue"}
          </button>
        )}
      </div>
      {open && items.length > 0 && (
        <ul data-testid="offline-queue" className="mt-2 flex flex-col gap-1">
          {items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 text-micro">
              <span className="truncate">
                {i.kind === "occurrence" ? "Occurrence" : i.kind}: {i.payload.title ?? "(untitled)"}
              </span>
              <span className="shrink-0 font-mono tabular-nums">
                captured {new Date(i.capturedAt).toLocaleTimeString()}
                {i.lastError ? ` · retry pending (${i.attempts})` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
