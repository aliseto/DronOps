import { describe, expect, it } from "vitest";
import { groupObligations, obligationSeverity, type Obligation } from "./obligations";

const d = (iso: string) => new Date(iso);
const NOW = d("2026-06-10T12:00:00Z");

describe("obligationSeverity", () => {
  it("is open without a deadline", () => {
    expect(obligationSeverity(null, NOW)).toBe("open");
  });
  it("is overdue at and past the deadline", () => {
    expect(obligationSeverity(d("2026-06-10T12:00:00Z"), NOW)).toBe("overdue");
    expect(obligationSeverity(d("2026-06-01T00:00:00Z"), NOW)).toBe("overdue");
  });
  it("is due-soon inside the warning window", () => {
    expect(obligationSeverity(d("2026-06-15T00:00:00Z"), NOW)).toBe("due-soon");
  });
  it("is open outside the window", () => {
    expect(obligationSeverity(d("2026-07-10T00:00:00Z"), NOW)).toBe("open");
  });
  it("respects a custom window", () => {
    expect(obligationSeverity(d("2026-06-12T00:00:00Z"), NOW, 1)).toBe("open");
  });
});

describe("groupObligations", () => {
  const o = (key: string, severity: Obligation["severity"], dueAt: Date | null): Obligation => ({
    key,
    kind: "test",
    title: key,
    dueAt,
    severity,
    href: "/",
  });

  it("groups by severity and sorts earliest deadline first, undated last", () => {
    const grouped = groupObligations([
      o("open-undated", "open", null),
      o("due-later", "due-soon", d("2026-06-16T00:00:00Z")),
      o("overdue-b", "overdue", d("2026-06-09T00:00:00Z")),
      o("due-sooner", "due-soon", d("2026-06-12T00:00:00Z")),
      o("overdue-a", "overdue", d("2026-06-01T00:00:00Z")),
    ]);
    expect(grouped.total).toBe(5);
    expect(grouped.overdue.map((x) => x.key)).toEqual(["overdue-a", "overdue-b"]);
    expect(grouped.dueSoon.map((x) => x.key)).toEqual(["due-sooner", "due-later"]);
    expect(grouped.open.map((x) => x.key)).toEqual(["open-undated"]);
  });

  it("handles the empty inbox (good-empty)", () => {
    const grouped = groupObligations([]);
    expect(grouped.total).toBe(0);
    expect(grouped.overdue).toEqual([]);
  });
});
