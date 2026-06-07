import { describe, it, expect } from "vitest";
import { DOMAIN_ROLES, DOMAIN_ROLE_LABELS, isDomainRole } from "./roles";

describe("domain roles", () => {
  it("covers the SoD-relevant roles with labels", () => {
    expect(DOMAIN_ROLES).toContain("accountable_manager");
    expect(DOMAIN_ROLES).toContain("quality_manager");
    expect(DOMAIN_ROLES).toContain("technician");
    for (const r of DOMAIN_ROLES) expect(DOMAIN_ROLE_LABELS[r]).toBeTruthy();
  });

  it("guards membership-role confusion (owner/admin/member are not domain roles)", () => {
    expect(isDomainRole("pilot")).toBe(true);
    expect(isDomainRole("owner")).toBe(false);
    expect(isDomainRole("admin")).toBe(false);
  });
});
