import { describe, it, expect } from "vitest";
import {
  CREDENTIAL_KINDS,
  CURRENCY_REQUIREMENTS,
  DUTY_SCHEMES,
  KNOWLEDGE_RECENCY_GATES,
  MEDICAL_GATES,
  OPERATOR_RECENCY_DEFAULT,
  credentialKindsForJurisdictions,
  getCredentialKind,
} from "./index";

describe("credential kinds + currency rules", () => {
  it("every required credential in a requirement set is a real kind", () => {
    for (const [jurisdiction, req] of Object.entries(CURRENCY_REQUIREMENTS)) {
      for (const code of req!.credentials) {
        expect(getCredentialKind(code), `${jurisdiction} → ${code}`).toBeDefined();
      }
    }
  });

  it("recency keys resolve to 'operator' or a known gate eventType", () => {
    for (const [jurisdiction, req] of Object.entries(CURRENCY_REQUIREMENTS)) {
      for (const key of req!.recency) {
        if (key === "operator") continue;
        expect(KNOWLEDGE_RECENCY_GATES[jurisdiction as "KSA"]?.eventType, `${jurisdiction} → ${key}`).toBe(key);
      }
    }
  });

  it("filters wallet kinds by enabled jurisdictions (+ cross-jurisdiction)", () => {
    const omanOnly = credentialKindsForJurisdictions(["Oman"]).map((k) => k.code);
    expect(omanOnly).toContain("oman_rp_certification");
    expect(omanOnly).toContain("medical");
    expect(omanOnly).not.toContain("ksa_rpc");
  });

  it("Oman medical gate cites CAR 102.185", () => {
    expect(MEDICAL_GATES.Oman?.clause).toBe("CAR 102.185");
    expect(MEDICAL_GATES.Oman?.credentialKind).toBe("medical");
  });

  it("operator recency default is the configurable 3/90 rule", () => {
    expect(OPERATOR_RECENCY_DEFAULT.minFlights).toBe(3);
    expect(OPERATOR_RECENCY_DEFAULT.windowDays).toBe(90);
    expect(OPERATOR_RECENCY_DEFAULT.configurable).toBe(true);
  });

  it("UAE-Dubai duty scheme exists but OSO#17 values are pending (flagged)", () => {
    const s = DUTY_SCHEMES["UAE-Dubai"];
    expect(s?.clause).toBe("DUOSAM OSO#17");
    expect(s?.valuesPending).toBe(true);
    expect(s?.maxDutyHoursPerPeriod).toBeNull();
  });

  it("every credential kind has a unique code", () => {
    const codes = CREDENTIAL_KINDS.map((k) => k.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
