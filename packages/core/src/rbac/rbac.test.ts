import { describe, it, expect } from "vitest";
import { capabilitiesFor, hasCapability, isTenantAdmin, ROLE_CAPABILITIES, ORG_ROLES } from "./index";

describe("rbac", () => {
  it("owner can do everything including tenant admin", () => {
    expect(hasCapability(["owner"], "tenant:admin")).toBe(true);
    expect(hasCapability(["owner"], "compliance:write")).toBe(true);
  });

  it("viewer is read-only", () => {
    expect(hasCapability(["viewer"], "read")).toBe(true);
    expect(hasCapability(["viewer"], "operations:write")).toBe(false);
  });

  it("HSE owns incidents but not compliance config", () => {
    expect(hasCapability(["hse_manager"], "incidents:write")).toBe(true);
    expect(hasCapability(["hse_manager"], "compliance:write")).toBe(false);
  });

  it("QC owns compliance config but not incidents", () => {
    expect(hasCapability(["qc_manager"], "compliance:write")).toBe(true);
    expect(hasCapability(["qc_manager"], "incidents:write")).toBe(false);
  });

  it("a pilot edits only their own flights, never tenant admin", () => {
    expect(hasCapability(["pilot"], "flights:write_own")).toBe(true);
    expect(hasCapability(["pilot"], "tenant:admin")).toBe(false);
  });

  it("multiple roles union their capabilities", () => {
    const caps = capabilitiesFor(["hse_manager", "qc_manager"]);
    expect(caps.has("incidents:write")).toBe(true);
    expect(caps.has("compliance:write")).toBe(true);
  });

  it("only owner/group_admin are tenant admins", () => {
    expect(isTenantAdmin(["owner"])).toBe(true);
    expect(isTenantAdmin(["group_admin"])).toBe(true);
  });

  it("every org role has a capability entry", () => {
    for (const r of ORG_ROLES) expect(ROLE_CAPABILITIES[r].length).toBeGreaterThan(0);
  });
});
