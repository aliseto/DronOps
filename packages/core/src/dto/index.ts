import { z } from "zod";
import { ORG_ROLES, TENANT_ROLES } from "../rbac/index";

/** Regulator codes seeded in 0001. UAE bundles GCAA (federal) + DCAA (Dubai). */
export const REGULATOR_CODES = ["GCAA", "DCAA", "GACA", "OMAN"] as const;
export type RegulatorCode = (typeof REGULATOR_CODES)[number];

export const createTenantInput = z.object({
  tenantName: z.string().min(1, "Enter a tenant name"),
});
export type CreateTenantInput = z.infer<typeof createTenantInput>;

export const createOrgInput = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1, "Enter an organisation name"),
  regulatorCode: z.enum(REGULATOR_CODES),
});
export type CreateOrgInput = z.infer<typeof createOrgInput>;

export const inviteInput = z.object({
  tenantId: z.string().uuid(),
  orgId: z.string().uuid().nullable(),
  email: z.string().email("Enter a valid email"),
  level: z.enum(["tenant", "org"]),
  role: z.enum([...TENANT_ROLES, ...ORG_ROLES]),
});
export type InviteInput = z.infer<typeof inviteInput>;
