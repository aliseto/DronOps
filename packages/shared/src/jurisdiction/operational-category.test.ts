import { describe, it, expect } from "vitest";
import { REQUIREMENTS, type RiskTier } from "@dronops/content";
import {
  categoryToTier,
  requirementAppliesToMission,
  requirementsForMission,
  type OperationalCategory,
} from "./operational-category";

const LOW: OperationalCategory[] = ["open", "standard"];
const HIGH: OperationalCategory[] = ["specific", "advanced"];

describe("operational-category gating", () => {
  it("maps categories to tiers", () => {
    expect(categoryToTier("open")).toBe("low");
    expect(categoryToTier("standard")).toBe("low");
    expect(categoryToTier("specific")).toBe("high");
    expect(categoryToTier("advanced")).toBe("high");
  });

  it("baseline applies to every operation; management_system to none", () => {
    for (const c of [...LOW, ...HIGH]) {
      expect(requirementAppliesToMission("baseline", c)).toBe(true);
      expect(requirementAppliesToMission("management_system", c)).toBe(false);
    }
  });

  it("a low-risk mission NEVER resolves a 'high' requirement", () => {
    for (const c of LOW) {
      expect(requirementAppliesToMission("high", c)).toBe(false);
      expect(requirementAppliesToMission("low", c)).toBe(true);
    }
  });

  it("a specific/advanced mission NEVER resolves a 'low' requirement", () => {
    for (const c of HIGH) {
      expect(requirementAppliesToMission("low", c)).toBe(false);
      expect(requirementAppliesToMission("high", c)).toBe(true);
    }
  });

  it("filtering real content: an open mission excludes all high + ISO requirements", () => {
    const applied = requirementsForMission(REQUIREMENTS, { operationalCategory: "open" });
    const tiers = new Set<RiskTier>(applied.map((r) => r.riskTier));
    expect(tiers.has("high")).toBe(false);
    expect(tiers.has("management_system")).toBe(false);
    // baseline (45) + low (1) only
    expect(applied).toHaveLength(46);
  });

  it("filtering real content: a specific mission excludes all low + ISO requirements", () => {
    const applied = requirementsForMission(REQUIREMENTS, { operationalCategory: "specific" });
    const tiers = new Set<RiskTier>(applied.map((r) => r.riskTier));
    expect(tiers.has("low")).toBe(false);
    expect(tiers.has("management_system")).toBe(false);
    // baseline (45) + high (26)
    expect(applied).toHaveLength(71);
  });
});
