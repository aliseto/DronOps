import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getAdminDb, withTenant, type TenantCtx, type Tx } from "@dronops/db";
import {
  auditEvents,
  credentials,
  dutyRecords,
  orgCurrencyRules,
  personRoles,
  persons,
  recencyEvents,
} from "@dronops/db/schema";
import {
  CREDENTIAL_KINDS,
  CURRENCY_REQUIREMENTS,
  JURISDICTIONS,
  OPERATOR_RECENCY_DEFAULT,
  getCredentialKind,
  type OperatorRecencyRule,
} from "@dronops/content";
import {
  dutyProjection,
  dutySchemeFor,
  fitToFly,
  operatorRecencyCurrency,
  type CredentialInput,
  type DutyProjection,
  type Jurisdiction,
  type ReadinessVerdict,
  type RecencyEvent,
} from "@dronops/shared";
import { listEnabledJurisdictions } from "./org";

type CredentialRow = typeof credentials.$inferSelect;
type RecencyRow = typeof recencyEvents.$inferSelect;
type DutyRow = typeof dutyRecords.$inferSelect;

async function audit(
  tx: Tx,
  ctx: TenantCtx,
  e: { action: string; entityType: string; entityId?: string; before?: unknown; after?: unknown },
) {
  await tx.insert(auditEvents).values({
    orgId: ctx.orgId,
    actorUserId: ctx.userId,
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId,
    before: e.before ?? null,
    after: e.after ?? null,
    amr: "password",
  });
}

// ─────────────────────────────────────────────────────── shared read helpers
/** Flying jurisdictions the org has enabled (those with fit-to-fly rules; ISO excluded). */
async function flyingJurisdictions(orgId: string): Promise<Jurisdiction[]> {
  const enabled = await listEnabledJurisdictions(orgId);
  return enabled.filter((j): j is Jurisdiction => j in CURRENCY_REQUIREMENTS) as Jurisdiction[];
}

/** Effective operator recency rule: org override merged over the content default. */
async function operatorRule(orgId: string): Promise<OperatorRecencyRule> {
  const [row] = await getAdminDb()
    .select()
    .from(orgCurrencyRules)
    .where(eq(orgCurrencyRules.orgId, orgId))
    .limit(1);
  if (!row) return OPERATOR_RECENCY_DEFAULT;
  return {
    ...OPERATOR_RECENCY_DEFAULT,
    minFlights: row.operatorMinFlights ?? OPERATOR_RECENCY_DEFAULT.minFlights,
    windowDays: row.operatorWindowDays ?? OPERATOR_RECENCY_DEFAULT.windowDays,
    perAirframeClass: row.operatorPerAirframeClass ?? OPERATOR_RECENCY_DEFAULT.perAirframeClass,
  };
}

/**
 * Whether the org runs UAE-Dubai SPECIFIC-CATEGORY operations — the trigger for
 * the OSO#17 duty/rest engine and the DUOSAM authorized-personnel export. Stored
 * on the existing org_currency_rules.duty_overrides jsonb so no schema change is
 * needed; M4 will supersede this org-level proxy with per-operation category.
 */
async function runsDubaiSpecificCategory(orgId: string): Promise<boolean> {
  const [row] = await getAdminDb()
    .select({ overrides: orgCurrencyRules.dutyOverrides })
    .from(orgCurrencyRules)
    .where(eq(orgCurrencyRules.orgId, orgId))
    .limit(1);
  const o = row?.overrides as { dubaiSpecificCategory?: boolean } | null | undefined;
  return o?.dubaiSpecificCategory === true;
}

const toCredentialInput = (c: CredentialRow): CredentialInput => ({
  kind: c.kind,
  verified: c.verified,
  expiresAt: c.expiresAt,
});
const toRecencyEvent = (e: RecencyRow): RecencyEvent => ({
  eventType: e.eventType,
  airframeClass: e.airframeClass,
  occurredAt: e.occurredAt,
  source: e.source,
});

/** Distinct airframe classes a person operates (from their flight recency events). */
function airframeClassesFor(events: RecencyRow[]): string[] {
  const set = new Set<string>();
  for (const e of events) if (e.eventType === "flight" && e.airframeClass) set.add(e.airframeClass);
  return [...set].sort();
}

// ───────────────────────────────────────────────────────────── crew roster
export interface CrewListItem {
  id: string;
  name: string;
  identityNo: string | null;
  employmentStatus: string;
  roles: string[];
  airframeClasses: string[];
  primaryClass: string | null;
  /** Worst verdict across the person's classes × enabled jurisdictions. */
  verdict: ReadinessVerdict["verdict"];
  blocksAssignment: boolean;
  /** Operator recency on the primary class: current count / required min. */
  recencyCount: number;
  recencyRequired: number;
  /** Active credentials expiring within 90 days. */
  expiring90: number;
  nextExpiry: string | null;
  hasWallet: boolean;
}

const VERDICT_RANK = { "not-fit": 3, unknown: 2, caution: 1, fit: 0 } as const;

export async function listCrew(orgId: string): Promise<CrewListItem[]> {
  const db = getAdminDb();
  const [people, creds, recency, jurisdictions, rule] = await Promise.all([
    db.select().from(persons).where(eq(persons.orgId, orgId)),
    db.select().from(credentials).where(eq(credentials.orgId, orgId)),
    db.select().from(recencyEvents).where(eq(recencyEvents.orgId, orgId)),
    flyingJurisdictions(orgId),
    operatorRule(orgId),
  ]);
  const roleRows = await db.select().from(personRoles).where(eq(personRoles.orgId, orgId));

  const credByPerson = new Map<string, CredentialRow[]>();
  for (const c of creds) {
    if (c.status !== "active") continue;
    (credByPerson.get(c.personId) ?? credByPerson.set(c.personId, []).get(c.personId)!).push(c);
  }
  const recByPerson = new Map<string, RecencyRow[]>();
  for (const e of recency)
    (recByPerson.get(e.personId) ?? recByPerson.set(e.personId, []).get(e.personId)!).push(e);
  const rolesByPerson = new Map<string, string[]>();
  for (const r of roleRows)
    (rolesByPerson.get(r.personId) ?? rolesByPerson.set(r.personId, []).get(r.personId)!).push(r.role);

  const now = new Date();
  const ms90 = 90 * 86_400_000;

  return people.map((p) => {
    const pc = credByPerson.get(p.id) ?? [];
    const pr = recByPerson.get(p.id) ?? [];
    const classes = airframeClassesFor(pr);
    const evalClasses = classes.length > 0 ? classes : ["—"];
    const credInputs = pc.map(toCredentialInput);
    const recInputs = pr.map(toRecencyEvent);

    let worst = -1;
    let blocks = false;
    let verdict: ReadinessVerdict["verdict"] = "unknown";
    for (const cls of evalClasses) {
      for (const j of jurisdictions) {
        const v = fitToFly(j, cls, { credentials: credInputs, recencyEvents: recInputs, operatorRecencyRule: rule }, now);
        if (v.checks.length === 0) continue;
        if (VERDICT_RANK[v.verdict] > worst) {
          worst = VERDICT_RANK[v.verdict];
          verdict = v.verdict;
        }
        if (v.blocksAssignment) blocks = true;
      }
    }

    const primaryClass = classes[0] ?? null;
    const rec = operatorRecencyCurrency(recInputs, primaryClass ?? "—", now, rule);
    const activeExpiries = pc.map((c) => c.expiresAt).filter((d): d is Date => d != null);
    const expiring90 = activeExpiries.filter((d) => d.getTime() - now.getTime() >= 0 && d.getTime() - now.getTime() <= ms90).length;
    const nextExpiry = activeExpiries.length
      ? new Date(Math.min(...activeExpiries.map((d) => d.getTime()))).toISOString()
      : null;

    return {
      id: p.id,
      name: p.name,
      identityNo: p.identityNo,
      employmentStatus: p.employmentStatus,
      roles: rolesByPerson.get(p.id) ?? [],
      airframeClasses: classes,
      primaryClass,
      verdict: worst < 0 ? "unknown" : verdict,
      blocksAssignment: worst < 0 ? true : blocks,
      recencyCount: rec.count ?? 0,
      recencyRequired: rule.minFlights,
      expiring90,
      nextExpiry,
      hasWallet: pc.length > 0,
    };
  });
}

// ──────────────────────────────────────────────────────────── person detail
export interface ReadinessCardData {
  airframeClass: string;
  jurisdiction: Jurisdiction;
  jurisdictionLabel: string;
  verdict: ReadinessVerdict;
}

export interface PersonDetail {
  person: {
    id: string;
    name: string;
    identityNo: string | null;
    email: string | null;
    phone: string | null;
    employmentStatus: string;
    employmentEndAt: string | null;
  };
  roles: string[];
  enabledJurisdictions: Jurisdiction[];
  airframeClasses: string[];
  readiness: ReadinessCardData[];
  duty: { projection: DutyProjection; records: DutyRow[]; schemeJurisdiction: Jurisdiction | null };
  credentials: CredentialRow[];
  recency: RecencyRow[];
  operatorRule: OperatorRecencyRule;
}

export async function getPersonDetail(orgId: string, personId: string): Promise<PersonDetail | null> {
  const db = getAdminDb();
  const [person] = await db
    .select()
    .from(persons)
    .where(and(eq(persons.orgId, orgId), eq(persons.id, personId)))
    .limit(1);
  if (!person) return null;

  const [creds, recency, duties, roleRows, jurisdictions, rule] = await Promise.all([
    db.select().from(credentials).where(and(eq(credentials.orgId, orgId), eq(credentials.personId, personId))).orderBy(desc(credentials.createdAt)),
    db.select().from(recencyEvents).where(and(eq(recencyEvents.orgId, orgId), eq(recencyEvents.personId, personId))).orderBy(desc(recencyEvents.occurredAt)),
    db.select().from(dutyRecords).where(and(eq(dutyRecords.orgId, orgId), eq(dutyRecords.personId, personId))).orderBy(desc(dutyRecords.startAt)),
    db.select({ role: personRoles.role }).from(personRoles).where(and(eq(personRoles.orgId, orgId), eq(personRoles.personId, personId))),
    flyingJurisdictions(orgId),
    operatorRule(orgId),
  ]);

  const now = new Date();
  const activeCreds = creds.filter((c) => c.status === "active").map(toCredentialInput);
  const recInputs = recency.map(toRecencyEvent);
  const classes = airframeClassesFor(recency);
  const evalClasses = classes.length > 0 ? classes : ["—"];

  const readiness: ReadinessCardData[] = [];
  for (const cls of evalClasses) {
    for (const j of jurisdictions) {
      const verdict = fitToFly(j, cls, { credentials: activeCreds, recencyEvents: recInputs, operatorRecencyRule: rule }, now);
      if (verdict.checks.length === 0) continue;
      readiness.push({ airframeClass: cls, jurisdiction: j, jurisdictionLabel: JURISDICTIONS[j].label, verdict });
    }
  }

  // Duty scheme exists when the org enables a jurisdiction that defines one
  // (UAE-Dubai). But OSO#17 duty/rest binds to SPECIFIC-CATEGORY operations, not
  // bare Dubai enablement — so applicability is gated separately. Until M4 carries
  // per-operation category, the org-level flag (org_currency_rules.duty_overrides
  // .dubaiSpecificCategory) is the signal; M4 will refine to per-assignment.
  const schemeJ = jurisdictions.find((j) => dutySchemeFor(j)) ?? null;
  const applicable = schemeJ != null && (await runsDubaiSpecificCategory(orgId));
  const duty = {
    projection: dutyProjection(
      duties.map((d) => ({ startAt: d.startAt, endAt: d.endAt, extraFlightAreas: d.extraFlightAreas })),
      schemeJ ? dutySchemeFor(schemeJ) : undefined,
      { applicable },
    ),
    records: duties,
    schemeJurisdiction: applicable ? schemeJ : null,
  };

  return {
    person: {
      id: person.id,
      name: person.name,
      identityNo: person.identityNo,
      email: person.email,
      phone: person.phone,
      employmentStatus: person.employmentStatus,
      employmentEndAt: person.employmentEndAt ? person.employmentEndAt.toISOString() : null,
    },
    roles: roleRows.map((r) => r.role),
    enabledJurisdictions: jurisdictions,
    airframeClasses: classes,
    readiness,
    duty,
    credentials: creds,
    recency,
    operatorRule: rule,
  };
}

// ───────────────────────────────────────────────────────────────── mutations
export async function addPerson(ctx: TenantCtx, input: { name: string; identityNo?: string; email?: string }) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [p] = await tx
      .insert(persons)
      .values({ orgId: ctx.orgId, name: input.name, identityNo: input.identityNo, email: input.email })
      .returning();
    if (!p) throw new Error("person insert failed");
    await audit(tx, ctx, { action: "person.create", entityType: "person", entityId: p.id, after: { name: input.name } });
    return p;
  });
}

export interface AddCredentialInput {
  personId: string;
  kind: string;
  credentialNo?: string;
  issuedAt?: Date;
  expiresAt?: Date;
  documentFileId?: string;
}

export async function addCredential(ctx: TenantCtx, input: AddCredentialInput) {
  const kindDef = getCredentialKind(input.kind);
  if (!kindDef) throw new Error(`Unknown credential kind: ${input.kind}`);
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [c] = await tx
      .insert(credentials)
      .values({
        orgId: ctx.orgId,
        personId: input.personId,
        kind: input.kind,
        jurisdiction: kindDef.jurisdiction,
        authority: kindDef.authority,
        credentialNo: input.credentialNo,
        issuedAt: input.issuedAt,
        expiresAt: input.expiresAt,
        documentFileId: input.documentFileId,
      })
      .returning();
    if (!c) throw new Error("credential insert failed");
    await audit(tx, ctx, { action: "credential.create", entityType: "credential", entityId: c.id, after: { kind: input.kind, credentialNo: input.credentialNo } });
    return c;
  });
}

/** Operator-verify a credential (records who/when). */
export async function verifyCredential(ctx: TenantCtx, credentialId: string, verifierPersonId: string) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [c] = await tx
      .update(credentials)
      .set({ verified: true, verifiedByPersonId: verifierPersonId, verifiedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(credentials.orgId, ctx.orgId), eq(credentials.id, credentialId)))
      .returning();
    if (!c) throw new Error("credential not found");
    await audit(tx, ctx, { action: "credential.verify", entityType: "credential", entityId: credentialId, after: { verifiedBy: verifierPersonId } });
    return c;
  });
}

/**
 * Renew/replace: supersede the old credential (append-only history, no delete)
 * and insert a fresh active one with the new dates.
 */
export async function renewCredential(
  ctx: TenantCtx,
  credentialId: string,
  input: { credentialNo?: string; issuedAt?: Date; expiresAt?: Date; documentFileId?: string },
) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [old] = await tx
      .select()
      .from(credentials)
      .where(and(eq(credentials.orgId, ctx.orgId), eq(credentials.id, credentialId)))
      .limit(1);
    if (!old) throw new Error("credential not found");
    await tx
      .update(credentials)
      .set({ status: "superseded", updatedAt: new Date() })
      .where(eq(credentials.id, credentialId));
    const [fresh] = await tx
      .insert(credentials)
      .values({
        orgId: ctx.orgId,
        personId: old.personId,
        kind: old.kind,
        jurisdiction: old.jurisdiction,
        authority: old.authority,
        credentialNo: input.credentialNo ?? old.credentialNo,
        issuedAt: input.issuedAt,
        expiresAt: input.expiresAt,
        documentFileId: input.documentFileId,
      })
      .returning();
    if (!fresh) throw new Error("credential insert failed");
    await audit(tx, ctx, { action: "credential.renew", entityType: "credential", entityId: fresh.id, before: { superseded: credentialId }, after: { expiresAt: input.expiresAt } });
    return fresh;
  });
}

export async function logRecencyEvent(
  ctx: TenantCtx,
  input: { personId: string; eventType: string; airframeClass?: string; occurredAt: Date; recordedByPersonId?: string },
) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [e] = await tx
      .insert(recencyEvents)
      .values({
        orgId: ctx.orgId,
        personId: input.personId,
        eventType: input.eventType,
        airframeClass: input.airframeClass,
        occurredAt: input.occurredAt,
        source: "manual",
        recordedByPersonId: input.recordedByPersonId,
      })
      .returning();
    if (!e) throw new Error("recency event insert failed");
    await audit(tx, ctx, { action: "recency_event.create", entityType: "recency_event", entityId: e.id, after: { eventType: input.eventType, airframeClass: input.airframeClass } });
    return e;
  });
}

export async function logDuty(
  ctx: TenantCtx,
  input: {
    personId: string;
    startAt: Date;
    endAt: Date;
    missionRef?: string;
    planned?: boolean;
    extraFlightAreas?: number;
  },
) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [d] = await tx
      .insert(dutyRecords)
      .values({
        orgId: ctx.orgId,
        personId: input.personId,
        startAt: input.startAt,
        endAt: input.endAt,
        missionRef: input.missionRef,
        planned: input.planned ?? false,
        extraFlightAreas: input.extraFlightAreas ?? 0,
      })
      .returning();
    if (!d) throw new Error("duty insert failed");
    await audit(tx, ctx, { action: "duty_record.create", entityType: "duty_record", entityId: d.id, after: { startAt: input.startAt, endAt: input.endAt, extraFlightAreas: input.extraFlightAreas ?? 0 } });
    return d;
  });
}

/**
 * Logged readiness override (the override path). Assignment proper lands in M4;
 * here the override is captured as an audit event so the justification trail
 * exists from day one — never a silent bypass.
 */
export async function recordReadinessOverride(
  ctx: TenantCtx,
  input: { personId: string; airframeClass: string; jurisdiction: string; reason: string },
) {
  if (!input.reason.trim()) throw new Error("An override requires a justification");
  return withTenant(getAdminDb(), ctx, async (tx) => {
    await audit(tx, ctx, {
      action: "currency.override",
      entityType: "person",
      entityId: input.personId,
      after: { airframeClass: input.airframeClass, jurisdiction: input.jurisdiction, reason: input.reason },
    });
  });
}

// ───────────────────────────────────────────────── DUOSAM authorized-personnel
export interface AuthorizedPersonnelRow {
  personId: string;
  name: string;
  role: string;
}

/**
 * Whether the DUOSAM authorized-personnel export should be offered: it appears
 * only when the org runs UAE-Dubai specific-category operations, not on bare
 * UAE-Dubai enablement (the export is a DUOSAM-specific obligation). The surface
 * must gate on this.
 */
export async function duosamExportAvailable(orgId: string): Promise<boolean> {
  const jurisdictions = await flyingJurisdictions(orgId);
  return jurisdictions.includes("UAE-Dubai") && (await runsDubaiSpecificCategory(orgId));
}

/**
 * DUOSAM authorized-personnel lists are queries, not documents (DRO-REG-001 §7):
 * generated live from person_roles so they are always current. Grouped by role.
 */
export async function authorizedPersonnelLists(orgId: string): Promise<Record<string, AuthorizedPersonnelRow[]>> {
  const db = getAdminDb();
  const rows = await db
    .select({ personId: personRoles.personId, role: personRoles.role, name: persons.name })
    .from(personRoles)
    .innerJoin(persons, eq(persons.id, personRoles.personId))
    .where(eq(personRoles.orgId, orgId));
  const out: Record<string, AuthorizedPersonnelRow[]> = {};
  for (const r of rows) (out[r.role] ??= []).push({ personId: r.personId, name: r.name, role: r.role });
  return out;
}

export { CREDENTIAL_KINDS };
