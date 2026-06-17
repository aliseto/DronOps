/**
 * Capability-based RBAC (Spec M0). Two levels of role — tenant and organisation
 * — and a role→capability map the app uses to gate UI. The database two-tier
 * RLS is the authoritative backstop; this map keeps the UI honest and explains
 * *why* an action is allowed. One person may hold several roles.
 */

export const TENANT_ROLES = ["owner", "group_admin"] as const;
export type TenantRole = (typeof TENANT_ROLES)[number];

export const ORG_ROLES = [
  "org_admin",
  "ops_manager",
  "pilot",
  "maintenance",
  "viewer",
  "hse_manager",
  "qc_manager",
] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export type Role = TenantRole | OrgRole;

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  group_admin: "Group admin",
  org_admin: "Org admin",
  ops_manager: "Ops manager",
  pilot: "Pilot",
  maintenance: "Maintenance",
  viewer: "Viewer",
  hse_manager: "HSE manager",
  qc_manager: "QC manager",
};

/** Coarse capabilities checked in the app layer. */
export type Capability =
  | "tenant:admin" // provision orgs, manage members, invite (tenant-wide)
  | "org:admin" // manage org settings + members within an org
  | "fleet:write"
  | "personnel:write"
  | "operations:write"
  | "maintenance:write"
  | "incidents:write" // HSE owns incidents
  | "compliance:write" // QC owns compliance/quality config
  | "flights:write_own" // a pilot edits only their own flights
  | "read"; // read-wide within scope

const ALL_WRITE: Capability[] = [
  "org:admin",
  "fleet:write",
  "personnel:write",
  "operations:write",
  "maintenance:write",
  "incidents:write",
  "compliance:write",
  "flights:write_own",
  "read",
];

export const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  // tenant-level admins carry full control across the tenant's orgs
  owner: ["tenant:admin", ...ALL_WRITE],
  group_admin: ["tenant:admin", ...ALL_WRITE],
  // org-level
  org_admin: [...ALL_WRITE],
  ops_manager: ["operations:write", "fleet:write", "personnel:write", "read"],
  pilot: ["flights:write_own", "maintenance:write", "read"], // can record inspections
  maintenance: ["maintenance:write", "read"],
  viewer: ["read"],
  hse_manager: ["incidents:write", "read"],
  qc_manager: ["compliance:write", "read"],
};

export function capabilitiesFor(roles: Role[]): Set<Capability> {
  const caps = new Set<Capability>();
  for (const r of roles) for (const c of ROLE_CAPABILITIES[r] ?? []) caps.add(c);
  return caps;
}

export function hasCapability(roles: Role[], capability: Capability): boolean {
  return capabilitiesFor(roles).has(capability);
}

export function isTenantRole(r: string): r is TenantRole {
  return (TENANT_ROLES as readonly string[]).includes(r);
}

export function isOrgRole(r: string): r is OrgRole {
  return (ORG_ROLES as readonly string[]).includes(r);
}

/** Tenant admins (owner / group admin) — the only roles that can provision. */
export function isTenantAdmin(tenantRoles: TenantRole[]): boolean {
  return tenantRoles.some((r) => r === "owner" || r === "group_admin");
}
