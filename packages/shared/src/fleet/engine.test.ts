import { describe, it, expect } from "vitest";
import { assetStatus, registrationCurrency } from "./engine";

const NOW = new Date("2026-06-07T00:00:00Z");
const daysAhead = (n: number) => new Date(NOW.getTime() + n * 86_400_000);
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

describe("registrationCurrency", () => {
  it("is none when no expiry is tracked", () => {
    expect(registrationCurrency({ registrationExpiresAt: null }, NOW).status).toBe("none");
  });
  it("uses the KSA Part 48 6-month renewal window (≈180 d)", () => {
    const r = registrationCurrency(
      { registrationExpiresAt: daysAhead(150), registrationJurisdiction: "KSA" },
      NOW,
    );
    expect(r.status).toBe("expiring"); // 150 d ≤ 180 d window
    expect(r.rule?.clause).toContain("Part 48");
  });
  it("is current well outside the window", () => {
    expect(
      registrationCurrency({ registrationExpiresAt: daysAhead(300), registrationJurisdiction: "KSA" }, NOW).status,
    ).toBe("current");
  });
  it("is lapsed once past expiry", () => {
    expect(registrationCurrency({ registrationExpiresAt: daysAgo(1) }, NOW).status).toBe("lapsed");
  });
});

describe("assetStatus precedence", () => {
  const base = { registrationExpiresAt: null as Date | null, registrationJurisdiction: null as string | null };
  it("grounded when condition is grounded", () => {
    expect(assetStatus({ ...base, condition: "grounded" }, NOW).status).toBe("grounded");
  });
  it("grounded when registration lapsed (even if condition operational)", () => {
    expect(
      assetStatus({ condition: "operational", registrationExpiresAt: daysAgo(2), registrationJurisdiction: "KSA" }, NOW).status,
    ).toBe("grounded");
  });
  it("in-maintenance when flagged and registration fine", () => {
    expect(assetStatus({ ...base, condition: "in_maintenance" }, NOW).status).toBe("in-maintenance");
  });
  it("due-soon when registration is in the renewal window", () => {
    expect(
      assetStatus({ condition: "operational", registrationExpiresAt: daysAhead(30), registrationJurisdiction: "KSA" }, NOW).status,
    ).toBe("due-soon");
  });
  it("operational when condition ok and no expiry tracked", () => {
    expect(assetStatus({ ...base, condition: "operational" }, NOW).status).toBe("operational");
  });
});
