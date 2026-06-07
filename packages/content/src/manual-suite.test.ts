import { describe, it, expect } from "vitest";
import {
  applicableDocs,
  manifestDocNumber,
  renderManualBody,
  DOC_MANIFEST,
} from "./manual-suite";

const params = {
  organization: { legal_name: "Acme FZ LLC", trade_name: "Acme" },
  thresholds: { records_retention_months: 36 },
  fleet_scope: { service_lines: ["mapping"], ops_types: ["VLOS"] },
  numbering_carryin: { keep_legacy_numbers: true, legacy_prefix: "AIR" },
};

describe("manual-suite pipeline", () => {
  it("substitutes variables and reports missing ones", () => {
    const { rendered, missing } = renderManualBody(
      "Org {{organization.legal_name}}; retain {{thresholds.records_retention_months}}m; pic {{postholders.accountable_manager}}",
      params,
      [],
    );
    expect(rendered).toContain("Org Acme FZ LLC");
    expect(rendered).toContain("retain 36m");
    expect(missing).toEqual(["postholders.accountable_manager"]);
  });

  it("renders only enabled jurisdiction blocks", () => {
    const body = "[[juris:KSA]]KSA block[[/juris]][[juris:IDN]]IDN block[[/juris]]";
    expect(renderManualBody(body, params, ["KSA"]).rendered).toBe("KSA block");
    expect(renderManualBody(body, params, []).rendered).toBe("");
  });

  it("filters conditional docs by scope (solar PV / dock excluded)", () => {
    const codes = applicableDocs(params).map((d) => d.source);
    expect(codes).toContain("MAN-001");
    expect(codes).not.toContain("SOP-007"); // requires solar_pv service line
    expect(codes).not.toContain("SOP-002"); // requires dock ops type
  });

  it("uses legacy numbers when carry-in is on", () => {
    const man = DOC_MANIFEST.find((d) => d.source === "MAN-001")!;
    expect(manifestDocNumber(man, params)).toBe("AIR-MAN-001");
    expect(manifestDocNumber(man, { numbering_carryin: { keep_legacy_numbers: false } })).toBe(
      "MAN-001",
    );
  });
});
