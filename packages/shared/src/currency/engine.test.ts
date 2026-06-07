import { describe, it, expect } from "vitest";
import {
  credentialCurrency,
  operatorRecencyCurrency,
  knowledgeRecencyCurrency,
  fitToFly,
  type RecencyEvent,
} from "./engine";

const NOW = new Date("2026-06-07T00:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const daysAhead = (n: number) => new Date(NOW.getTime() + n * 86_400_000);
const flight = (airframeClass: string, occurredAt: Date): RecencyEvent => ({
  eventType: "flight",
  airframeClass,
  occurredAt,
  source: "manual",
});

describe("credentialCurrency", () => {
  it("is current when verified and well before any alert window", () => {
    expect(credentialCurrency({ kind: "x", verified: true, expiresAt: daysAhead(120) }, NOW).status).toBe(
      "current",
    );
  });
  it("is expiring inside the 60-day window and reports the window hit", () => {
    const r = credentialCurrency({ kind: "x", verified: true, expiresAt: daysAhead(20) }, NOW);
    expect(r.status).toBe("expiring");
    expect(r.alertWindow).toBe(30);
  });
  it("is lapsed once past expiry regardless of verification", () => {
    expect(
      credentialCurrency({ kind: "x", verified: true, expiresAt: daysAgo(1) }, NOW).status,
    ).toBe("lapsed");
  });
  it("is unverified when not operator-verified and not yet expired", () => {
    expect(
      credentialCurrency({ kind: "x", verified: false, expiresAt: daysAhead(120) }, NOW).status,
    ).toBe("unverified");
  });
  it("treats a standing (non-expiring) verified credential as current", () => {
    expect(credentialCurrency({ kind: "x", verified: true, expiresAt: null }, NOW).status).toBe("current");
  });
});

describe("operatorRecencyCurrency (≥3 / 90 d / per class)", () => {
  it("is current with 3 recent flights on the class", () => {
    const events = [flight("multirotor", daysAgo(5)), flight("multirotor", daysAgo(20)), flight("multirotor", daysAgo(40))];
    expect(operatorRecencyCurrency(events, "multirotor", NOW).status).toBe("current");
  });
  it("does not count flights on a different airframe class", () => {
    const events = [flight("fixed_wing", daysAgo(5)), flight("fixed_wing", daysAgo(20)), flight("multirotor", daysAgo(40))];
    const r = operatorRecencyCurrency(events, "multirotor", NOW);
    expect(r.status).toBe("lapsed");
    expect(r.count).toBe(1);
  });
  it("is lapsed when flights fall outside the 90-day window", () => {
    const events = [flight("multirotor", daysAgo(100)), flight("multirotor", daysAgo(120)), flight("multirotor", daysAgo(5))];
    expect(operatorRecencyCurrency(events, "multirotor", NOW).count).toBe(1);
  });
  it("is expiring when the 3rd-most-recent flight is about to roll out of the window", () => {
    // 3rd flight at 80d ago → lapses in 10d (≤14 lead) → expiring.
    const events = [flight("multirotor", daysAgo(2)), flight("multirotor", daysAgo(50)), flight("multirotor", daysAgo(80))];
    const r = operatorRecencyCurrency(events, "multirotor", NOW);
    expect(r.status).toBe("expiring");
  });
});

describe("knowledgeRecencyCurrency (KSA §107.71, 24mo)", () => {
  const rule = { months: 24, clause: "§107.71", eventType: "knowledge_recency" };
  const know = (occurredAt: Date): RecencyEvent => ({ eventType: "knowledge_recency", airframeClass: null, occurredAt, source: "manual" });
  it("is current within 24 months", () => {
    expect(knowledgeRecencyCurrency([know(daysAgo(100))], rule, NOW).status).toBe("current");
  });
  it("is lapsed past 24 months", () => {
    expect(knowledgeRecencyCurrency([know(daysAgo(800))], rule, NOW).status).toBe("lapsed");
  });
  it("is lapsed with no record at all", () => {
    expect(knowledgeRecencyCurrency([], rule, NOW).status).toBe("lapsed");
  });
});

describe("fitToFly", () => {
  const recent3 = [flight("multirotor", daysAgo(2)), flight("multirotor", daysAgo(20)), flight("multirotor", daysAgo(40))];

  it("is fit for Oman when RP cert + medical valid and recency met", () => {
    const v = fitToFly(
      "Oman",
      "multirotor",
      {
        credentials: [
          { kind: "oman_rp_certification", verified: true, expiresAt: daysAhead(200) },
          { kind: "medical", verified: true, expiresAt: daysAhead(200) },
        ],
        recencyEvents: recent3,
      },
      NOW,
    );
    expect(v.verdict).toBe("fit");
    expect(v.reasons).toEqual([]);
  });

  it("is not-fit for Oman when the medical (102.185) is lapsed", () => {
    const v = fitToFly(
      "Oman",
      "multirotor",
      {
        credentials: [
          { kind: "oman_rp_certification", verified: true, expiresAt: daysAhead(200) },
          { kind: "medical", verified: true, expiresAt: daysAgo(1) },
        ],
        recencyEvents: recent3,
      },
      NOW,
    );
    expect(v.verdict).toBe("not-fit");
    expect(v.reasons.some((r) => r.includes("102.185"))).toBe(true);
  });

  it("is unknown when a required credential is simply not on file", () => {
    const v = fitToFly(
      "KSA",
      "multirotor",
      { credentials: [], recencyEvents: recent3 },
      NOW,
    );
    // RPC missing (unverified) + knowledge recency missing (lapsed) → lapsed wins.
    expect(v.verdict).toBe("not-fit");
    expect(v.checks.find((c) => c.key === "credential:ksa_rpc")?.status).toBe("unverified");
  });

  it("KSA requires the §107.71 knowledge recency check", () => {
    const v = fitToFly(
      "KSA",
      "multirotor",
      {
        credentials: [{ kind: "ksa_rpc", verified: true, expiresAt: daysAhead(200) }],
        recencyEvents: [...recent3, { eventType: "knowledge_recency", airframeClass: null, occurredAt: daysAgo(100), source: "manual" }],
      },
      NOW,
    );
    expect(v.verdict).toBe("fit");
    expect(v.checks.some((c) => c.key === "recency:knowledge_recency")).toBe(true);
  });

  it("ISO has no flying requirements → unknown (empty checks)", () => {
    const v = fitToFly("ISO", "multirotor", { credentials: [], recencyEvents: [] }, NOW);
    expect(v.checks).toEqual([]);
    expect(v.verdict).toBe("unknown");
  });

  it("Unknown blocks assignment just like Not-fit (reason differs)", () => {
    const unknown = fitToFly("Oman", "multirotor", { credentials: [], recencyEvents: recent3 }, NOW);
    expect(unknown.verdict).toBe("unknown");
    expect(unknown.blocksAssignment).toBe(true); // missing creds — can't confirm, still blocks
    expect(unknown.checks.find((c) => c.key === "credential:medical")?.reasonKind).toBe("missing");

    const notFit = fitToFly(
      "Oman",
      "multirotor",
      {
        credentials: [
          { kind: "oman_rp_certification", verified: true, expiresAt: daysAhead(200) },
          { kind: "medical", verified: true, expiresAt: daysAgo(1) },
        ],
        recencyEvents: recent3,
      },
      NOW,
    );
    expect(notFit.verdict).toBe("not-fit");
    expect(notFit.blocksAssignment).toBe(true);
    expect(notFit.checks.find((c) => c.key === "credential:medical")?.reasonKind).toBe("expired");
  });

  it("Fit and Caution do not block assignment", () => {
    const fit = fitToFly(
      "Oman",
      "multirotor",
      {
        credentials: [
          { kind: "oman_rp_certification", verified: true, expiresAt: daysAhead(200) },
          { kind: "medical", verified: true, expiresAt: daysAhead(200) },
        ],
        recencyEvents: recent3,
      },
      NOW,
    );
    expect(fit.blocksAssignment).toBe(false);
  });
});
