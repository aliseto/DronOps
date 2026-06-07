import { describe, it, expect } from "vitest";
import { withAudit } from "./with-audit";
import type { Tx } from "../client";

describe("withAudit", () => {
  it("runs the mutation then writes an audit row from the result", async () => {
    const inserted: Array<Record<string, unknown>> = [];
    const tx = {
      insert: () => ({
        values: (v: Record<string, unknown>) => {
          inserted.push(v);
          return Promise.resolve();
        },
      }),
    } as unknown as Tx;

    const result = await withAudit<{ id: string }>(
      tx,
      { orgId: "org-1", userId: "user-1" },
      (r) => ({
        action: "organization.create",
        entityType: "organization",
        entityId: r.id,
        after: r,
        amr: "password",
      }),
      async () => ({ id: "abc" }),
    );

    expect(result.id).toBe("abc");
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({
      orgId: "org-1",
      actorUserId: "user-1",
      action: "organization.create",
      entityId: "abc",
      amr: "password",
    });
  });

  it("defaults amr to system and context to null", async () => {
    let captured: Record<string, unknown> | undefined;
    const tx = {
      insert: () => ({
        values: (v: Record<string, unknown>) => {
          captured = v;
          return Promise.resolve();
        },
      }),
    } as unknown as Tx;

    await withAudit(tx, { orgId: "o", userId: "u" }, { action: "a", entityType: "t" }, async () => 1);

    expect(captured?.amr).toBe("system");
    expect(captured?.context).toBeNull();
  });
});
