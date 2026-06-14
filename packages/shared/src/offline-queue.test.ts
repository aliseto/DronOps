import { describe, expect, it } from "vitest";
import { OfflineQueue, type QueuedItem, type QueueStore } from "./offline-queue";

function memoryStore(): QueueStore {
  let items: QueuedItem[] = [];
  return {
    load: async () => items.map((i) => ({ ...i })),
    save: async (next) => {
      items = next.map((i) => ({ ...i }));
    },
  };
}

const ids = () => {
  let n = 0;
  return () => `id-${++n}`;
};

describe("OfflineQueue", () => {
  it("enqueues FIFO with the device capture timestamp preserved", async () => {
    const q = new OfflineQueue(memoryStore(), ids());
    await q.enqueue("occurrence", { title: "first" }, new Date("2026-06-11T09:14:00Z"));
    await q.enqueue("occurrence", { title: "second" });
    const items = await q.list();
    expect(items.map((i) => i.payload.title)).toEqual(["first", "second"]);
    expect(items[0]!.capturedAt).toBe("2026-06-11T09:14:00.000Z");
  });

  it("replay removes successes and keeps failures with the error attached", async () => {
    const q = new OfflineQueue(memoryStore(), ids());
    await q.enqueue("occurrence", { title: "ok" });
    await q.enqueue("occurrence", { title: "bad" });
    await q.enqueue("occurrence", { title: "also-ok" });

    const { synced, remaining } = await q.replay(async (item) => {
      if (item.payload.title === "bad") throw new Error("server rejected");
    });

    expect(synced).toBe(2); // one bad item must not dam the queue
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.payload.title).toBe("bad");
    expect(remaining[0]!.attempts).toBe(1);
    expect(remaining[0]!.lastError).toBe("server rejected");
    expect(await q.list()).toHaveLength(1);
  });

  it("failed items survive repeated replays (never silently dropped)", async () => {
    const q = new OfflineQueue(memoryStore(), ids());
    await q.enqueue("occurrence", { title: "stuck" });
    await q.replay(async () => {
      throw new Error("offline again");
    });
    const { remaining } = await q.replay(async () => {
      throw new Error("still failing");
    });
    expect(remaining[0]!.attempts).toBe(2);
    expect(remaining[0]!.lastError).toBe("still failing");
  });
});
