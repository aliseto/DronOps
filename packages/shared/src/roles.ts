/**
 * Domain RBAC vocabulary (fixed code constant, not a tenant table). person_roles
 * rows reference these keys. Distinct from platform access (memberships.role).
 */
export const DOMAIN_ROLES = [
  "accountable_manager",
  "quality_manager",
  "ops_manager",
  "operations_team",
  "approval_admin",
  "pilot",
  "technician",
  "auditor_guest",
] as const;

export type DomainRole = (typeof DOMAIN_ROLES)[number];

export const DOMAIN_ROLE_LABELS: Record<DomainRole, string> = {
  accountable_manager: "Accountable manager",
  quality_manager: "Quality manager",
  ops_manager: "Operations manager",
  operations_team: "Operations team",
  approval_admin: "Approval admin",
  pilot: "Pilot",
  technician: "Technician",
  auditor_guest: "Auditor (guest)",
};

export const isDomainRole = (v: string): v is DomainRole =>
  (DOMAIN_ROLES as readonly string[]).includes(v);
