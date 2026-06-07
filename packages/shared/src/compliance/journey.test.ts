import { describe, it, expect } from "vitest";
import {
  deviationToFinding,
  applyTriage,
  findingTransition,
  sodViolation,
} from "./findings";
import type { FlightDeviation } from "../flight/engine";

/**
 * The deviation→finding journey, end to end at the policy level:
 * sealed-flight deviation → auto-raised finding → triage-accept → CAPA lifecycle
 * → SoD-blocked self-close. The DB-backed browser run isn't possible in the
 * no-DB e2e environment; the data-layer guarantees (auto-raise at seal, the SoD
 * + terminal-immutability triggers) are verified via SQL probes in PR-025.
 */
describe("deviation → finding journey", () => {
  const raised = new Date("2026-06-01T00:00:00Z");
  const raiser = "person-quality-mgr";

  it("walks seal-deviation → auto-raise → accept → CAPA → SoD-blocked self-close", () => {
    // 1. A sealed flight's ceiling exceedance.
    const dev: FlightDeviation = { code: "ceiling_exceedance", detail: "Reached 138 m vs 120 m AGL", severity: "high", clause: "UAC.045" };

    // 2. Auto-raised at seal → an open, major finding with a content-driven CAPA due date.
    const finding = deviationToFinding(dev, "UAE-Federal", raised);
    expect(finding.level).toBe("major");
    expect(finding.dueAt.toISOString()).toBe("2026-06-08T00:00:00.000Z");
    let status: string = "open";
    let level = finding.level;

    // 3. Triage: accept (reason optional) keeps the NCR at its level.
    const triaged = applyTriage("accept", level);
    level = triaged.level;
    expect(level).toBe("major");
    expect(triaged.status).toBeUndefined(); // stays open

    // 4. CAPA lifecycle: open → containment → capa-in-progress → verify.
    for (const to of ["containment", "capa-in-progress", "verify"] as const) {
      const t = findingTransition(status as never, to);
      expect(t).not.toBeNull();
      status = to;
    }

    // 5. Closure requires a verifier ≠ raiser (SoD). The raiser is blocked…
    expect(findingTransition(status as never, "closed")?.verifies).toBe(true);
    expect(sodViolation(raiser, raiser)).toBe(true);
    // …a different verifier may close.
    expect(sodViolation(raiser, "person-accountable-mgr")).toBe(false);
  });

  it("downgrade and false-positive weaken the signal and must carry a reason (enforced in the service)", () => {
    expect(applyTriage("downgrade", "major").level).toBe("observation");
    expect(applyTriage("false-positive", "minor").status).toBe("false-positive");
  });
});
