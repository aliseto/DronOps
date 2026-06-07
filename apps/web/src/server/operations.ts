import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getAdminDb, withTenant, type TenantCtx, type Tx } from "@dronops/db";
import {
  auditEvents,
  aircraft,
  counters,
  credentials,
  dutyRecords,
  missionCrew,
  missionDocuments,
  missionLocations,
  missionNotes,
  missions,
  orgCurrencyRules,
  persons,
  recencyEvents,
} from "@dronops/db/schema";
import {
  OPERATOR_RECENCY_DEFAULT,
  type OperatorRecencyRule,
} from "@dronops/content";
import { parseKml } from "@dronops/parsers";
import {
  interleaveActivity,
  missionReadiness,
  transitionFor,
  type ActivityEntry,
  type CrewMemberInput,
  type MissionState,
  type OperationalCategory,
  type CrewReadiness,
  type Jurisdiction,
} from "@dronops/shared";

type MissionRow = typeof missions.$inferSelect;

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

async function nextMissionNo(tx: Tx, orgId: string): Promise<string> {
  const [c] = await tx
    .insert(counters)
    .values({ orgId, key: "mission", value: 1 })
    .onConflictDoUpdate({ target: [counters.orgId, counters.key], set: { value: sql`${counters.value} + 1`, updatedAt: new Date() } })
    .returning({ value: counters.value });
  return `MIS-${String(c!.value).padStart(3, "0")}`;
}

async function operatorRule(orgId: string): Promise<OperatorRecencyRule> {
  const [row] = await getAdminDb().select().from(orgCurrencyRules).where(eq(orgCurrencyRules.orgId, orgId)).limit(1);
  if (!row) return OPERATOR_RECENCY_DEFAULT;
  return {
    ...OPERATOR_RECENCY_DEFAULT,
    minFlights: row.operatorMinFlights ?? OPERATOR_RECENCY_DEFAULT.minFlights,
    windowDays: row.operatorWindowDays ?? OPERATOR_RECENCY_DEFAULT.windowDays,
    perAirframeClass: row.operatorPerAirframeClass ?? OPERATOR_RECENCY_DEFAULT.perAirframeClass,
  };
}

// ─────────────────────────────────────────── crew readiness assembly (engine input)
async function buildCrewInputs(
  orgId: string,
  missionRow: MissionRow,
  airframeClass: string,
): Promise<CrewMemberInput[]> {
  const db = getAdminDb();
  const crew = await db.select().from(missionCrew).where(and(eq(missionCrew.orgId, orgId), eq(missionCrew.missionId, missionRow.id)));
  if (crew.length === 0) return [];
  const personIds = crew.map((c) => c.personId);
  const [people, creds, recency, duties, rule] = await Promise.all([
    db.select().from(persons).where(and(eq(persons.orgId, orgId), inArray(persons.id, personIds))),
    db.select().from(credentials).where(and(eq(credentials.orgId, orgId), inArray(credentials.personId, personIds))),
    db.select().from(recencyEvents).where(and(eq(recencyEvents.orgId, orgId), inArray(recencyEvents.personId, personIds))),
    db.select().from(dutyRecords).where(and(eq(dutyRecords.orgId, orgId), inArray(dutyRecords.personId, personIds))),
    operatorRule(orgId),
  ]);
  const nameOf = new Map(people.map((p) => [p.id, p.name]));
  return crew.map((c) => ({
    personId: c.personId,
    name: nameOf.get(c.personId) ?? "Unknown",
    role: c.role,
    airframeClass,
    currency: {
      credentials: creds.filter((x) => x.personId === c.personId && x.status === "active").map((x) => ({ kind: x.kind, verified: x.verified, expiresAt: x.expiresAt })),
      recencyEvents: recency.filter((x) => x.personId === c.personId).map((x) => ({ eventType: x.eventType, airframeClass: x.airframeClass, occurredAt: x.occurredAt, source: x.source })),
      operatorRecencyRule: rule,
    },
    dutyRecords: duties.filter((x) => x.personId === c.personId).map((x) => ({ startAt: x.startAt, endAt: x.endAt, extraFlightAreas: x.extraFlightAreas })),
    overridden: c.overrideReason != null,
  }));
}

async function readinessFor(orgId: string, m: MissionRow) {
  let airframeClass = "—";
  if (m.aircraftId) {
    const [a] = await getAdminDb().select({ c: aircraft.airframeClass }).from(aircraft).where(eq(aircraft.id, m.aircraftId)).limit(1);
    if (a) airframeClass = a.c;
  }
  const crew = await buildCrewInputs(orgId, m, airframeClass);
  return missionReadiness(
    { jurisdiction: m.jurisdiction as Jurisdiction, operationalCategory: m.operationalCategory as OperationalCategory, ceilingM: m.ceilingM != null ? Number(m.ceilingM) : null },
    crew,
    new Date(),
  );
}

// ─────────────────────────────────────────────────────────────────── queries
export interface MissionListItem {
  id: string;
  code: string;
  title: string;
  jurisdiction: string;
  operationalCategory: string;
  status: string;
  authority: string | null;
  plannedStartAt: string | null;
  plannedEndAt: string | null;
  blockingCrew: number;
  crewCount: number;
}

export async function listMissions(orgId: string): Promise<MissionListItem[]> {
  const db = getAdminDb();
  const rows = await db.select().from(missions).where(eq(missions.orgId, orgId)).orderBy(desc(missions.createdAt));
  const out: MissionListItem[] = [];
  for (const m of rows) {
    const r = m.status === "approved" || m.status === "ready" ? await readinessFor(orgId, m) : null;
    out.push({
      id: m.id,
      code: m.code,
      title: m.title,
      jurisdiction: m.jurisdiction,
      operationalCategory: m.operationalCategory,
      status: m.status,
      authority: m.authority,
      plannedStartAt: m.plannedStartAt ? m.plannedStartAt.toISOString() : null,
      plannedEndAt: m.plannedEndAt ? m.plannedEndAt.toISOString() : null,
      blockingCrew: r ? r.blockingCrew.length : 0,
      crewCount: r ? r.crew.length : 0,
    });
  }
  return out;
}

export interface MissionDetail {
  mission: {
    id: string;
    code: string;
    title: string;
    jurisdiction: string;
    operationalCategory: string;
    status: string;
    aircraftId: string | null;
    aircraftLabel: string | null;
    plannedStartAt: string | null;
    plannedEndAt: string | null;
    ceilingM: number | null;
    authority: string | null;
    applicationRef: string | null;
    submittedAt: string | null;
    authorizationType: string | null;
    authorizationRef: string | null;
    mediaAttribution: boolean;
    greenZoneConfirmedAt: string | null;
    notes: string | null;
  };
  readiness: {
    riskTier: string;
    dutyApplies: boolean;
    ceilingM: number | null;
    blocked: boolean;
    requirementCounts: { baseline: number; high: number; low: number };
    gates: { type: string; clause: string }[];
    crew: {
      missionCrewId: string | null;
      personId: string;
      name: string;
      role: string;
      verdict: string;
      dutyStatus: string;
      blocks: boolean;
      blocksEffective: boolean;
      overridden: boolean;
      reasons: string[];
    }[];
  };
  locations: { id: string; governorate: string | null; wilayat: string | null; village: string | null; latitude: number | null; longitude: number | null; ceilingM: number | null }[];
  documents: { id: string; flow: string; kind: string; label: string | null; fileId: string; createdAt: string }[];
  notes: { count: number; latest: { author: string; body: string; at: string } | null };
}

export async function getMissionDetail(orgId: string, id: string): Promise<MissionDetail | null> {
  const db = getAdminDb();
  const [m] = await db.select().from(missions).where(and(eq(missions.orgId, orgId), eq(missions.id, id))).limit(1);
  if (!m) return null;
  let aircraftLabel: string | null = null;
  if (m.aircraftId) {
    const [a] = await db.select({ label: aircraft.label }).from(aircraft).where(eq(aircraft.id, m.aircraftId)).limit(1);
    aircraftLabel = a?.label ?? null;
  }
  const r = await readinessFor(orgId, m);
  const [locs, docs, crewRows, noteRows] = await Promise.all([
    db.select().from(missionLocations).where(and(eq(missionLocations.orgId, orgId), eq(missionLocations.missionId, id))),
    db.select().from(missionDocuments).where(and(eq(missionDocuments.orgId, orgId), eq(missionDocuments.missionId, id))).orderBy(desc(missionDocuments.createdAt)),
    db.select().from(missionCrew).where(and(eq(missionCrew.orgId, orgId), eq(missionCrew.missionId, id))),
    db.select().from(missionNotes).where(and(eq(missionNotes.orgId, orgId), eq(missionNotes.missionId, id))).orderBy(desc(missionNotes.createdAt)),
  ]);
  let latestNote: MissionDetail["notes"]["latest"] = null;
  if (noteRows[0]) {
    const a = noteRows[0].authorPersonId
      ? (await db.select({ name: persons.name }).from(persons).where(eq(persons.id, noteRows[0].authorPersonId)).limit(1))[0]?.name
      : null;
    latestNote = { author: a ?? "Unknown", body: noteRows[0].body, at: noteRows[0].createdAt.toISOString() };
  }
  const crewIdByKey = new Map(crewRows.map((c) => [`${c.personId}|${c.role}`, c.id]));
  const counts = { baseline: 0, high: 0, low: 0 };
  for (const req of r.applicableRequirements) {
    if (req.riskTier === "baseline") counts.baseline++;
    else if (req.riskTier === "high") counts.high++;
    else if (req.riskTier === "low") counts.low++;
  }
  const crewView = (c: CrewReadiness) => ({
    missionCrewId: crewIdByKey.get(`${c.personId}|${c.role}`) ?? null,
    personId: c.personId,
    name: c.name,
    role: c.role,
    verdict: c.fit.verdict,
    dutyStatus: c.duty.status,
    blocks: c.blocks,
    blocksEffective: c.blocksEffective,
    overridden: c.blocks && !c.blocksEffective,
    reasons: c.reasons,
  });
  const num = (v: unknown) => (v == null ? null : Number(v));
  return {
    mission: {
      id: m.id,
      code: m.code,
      title: m.title,
      jurisdiction: m.jurisdiction,
      operationalCategory: m.operationalCategory,
      status: m.status,
      aircraftId: m.aircraftId,
      aircraftLabel,
      plannedStartAt: m.plannedStartAt ? m.plannedStartAt.toISOString() : null,
      plannedEndAt: m.plannedEndAt ? m.plannedEndAt.toISOString() : null,
      ceilingM: num(m.ceilingM),
      authority: m.authority,
      applicationRef: m.applicationRef,
      submittedAt: m.submittedAt ? m.submittedAt.toISOString() : null,
      authorizationType: m.authorizationType,
      authorizationRef: m.authorizationRef,
      mediaAttribution: m.mediaAttribution,
      greenZoneConfirmedAt: m.greenZoneConfirmedAt ? m.greenZoneConfirmedAt.toISOString() : null,
      notes: m.notes,
    },
    readiness: {
      riskTier: r.riskTier,
      dutyApplies: r.dutyApplies,
      ceilingM: r.ceilingM,
      blocked: r.blocked,
      requirementCounts: counts,
      gates: r.gates.map((g) => ({ type: g.type, clause: g.rule.clause })),
      crew: r.crew.map(crewView),
    },
    locations: locs.map((l) => ({ id: l.id, governorate: l.governorate, wilayat: l.wilayat, village: l.village, latitude: num(l.latitude), longitude: num(l.longitude), ceilingM: num(l.ceilingM) })),
    documents: docs.map((d) => ({ id: d.id, flow: d.flow, kind: d.kind, label: d.label, fileId: d.fileId, createdAt: d.createdAt.toISOString() })),
    notes: { count: noteRows.length, latest: latestNote },
  };
}

// ───────────────────────────────────────────── activity thread (notes + events)
export type ThreadEntry = ActivityEntry;

/**
 * The mission activity thread — manual notes interleaved with the mission's own
 * audit events, newest first. Notes carry their author + body; events are the
 * lifecycle/override/upload entries the mission already emits.
 */
export async function getMissionThread(orgId: string, missionId: string): Promise<ThreadEntry[]> {
  const db = getAdminDb();
  const [notes, events] = await Promise.all([
    db.select().from(missionNotes).where(and(eq(missionNotes.orgId, orgId), eq(missionNotes.missionId, missionId))).orderBy(desc(missionNotes.createdAt)),
    db.select().from(auditEvents).where(and(eq(auditEvents.orgId, orgId), eq(auditEvents.entityType, "mission"), eq(auditEvents.entityId, missionId))).orderBy(desc(auditEvents.createdAt)).limit(200),
  ]);
  const authorIds = [...new Set(notes.map((n) => n.authorPersonId).filter((x): x is string => x != null))];
  const authors = authorIds.length
    ? await db.select({ id: persons.id, name: persons.name }).from(persons).where(inArray(persons.id, authorIds))
    : [];
  const nameOf = new Map(authors.map((a) => [a.id, a.name]));

  const noteEntries: ThreadEntry[] = notes.map((n) => ({
    id: `note:${n.id}`,
    kind: "note",
    action: "Note",
    actor: n.authorPersonId ? nameOf.get(n.authorPersonId) ?? "Unknown" : "Unknown",
    at: n.createdAt.toISOString(),
    body: n.body,
    hasAttachment: n.fileId != null,
  }));
  const eventEntries: ThreadEntry[] = events.map((e) => ({
    id: e.id,
    kind: "event",
    action: e.action,
    actor: e.actorUserId,
    at: e.createdAt.toISOString(),
  }));
  return interleaveActivity(noteEntries, eventEntries);
}

/** Append a manual note (optionally with a content-addressed attachment). */
export async function addMissionNote(
  ctx: TenantCtx,
  input: { missionId: string; body: string; authorPersonId?: string; fileId?: string },
) {
  if (!input.body.trim()) throw new Error("A note cannot be empty");
  return withTenant(getAdminDb(), ctx, async (tx) => {
    await tx.insert(missionNotes).values({
      orgId: ctx.orgId,
      missionId: input.missionId,
      authorPersonId: input.authorPersonId,
      body: input.body.trim(),
      fileId: input.fileId,
    });
    // The note is itself the record; a light audit entry keeps the thread complete.
    await audit(tx, ctx, { action: "mission.note_added", entityType: "mission", entityId: input.missionId });
  });
}

// ───────────────────────────────────────────────────────────────── mutations
export interface CreateMissionInput {
  title: string;
  jurisdiction: string;
  operationalCategory: OperationalCategory;
  aircraftId?: string;
  plannedStartAt?: Date;
  plannedEndAt?: Date;
  ceilingM?: number;
}

export async function createMission(ctx: TenantCtx, input: CreateMissionInput) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const code = await nextMissionNo(tx, ctx.orgId);
    const [m] = await tx
      .insert(missions)
      .values({
        orgId: ctx.orgId,
        code,
        title: input.title,
        jurisdiction: input.jurisdiction,
        operationalCategory: input.operationalCategory,
        aircraftId: input.aircraftId,
        plannedStartAt: input.plannedStartAt,
        plannedEndAt: input.plannedEndAt,
        ceilingM: input.ceilingM != null ? String(input.ceilingM) : null,
        status: "planning",
      })
      .returning();
    if (!m) throw new Error("mission insert failed");
    await audit(tx, ctx, { action: "mission.create", entityType: "mission", entityId: m.id, after: { code, title: input.title } });
    return m;
  });
}

/**
 * Lifecycle transition. Validates role ownership (transitionFor) and, for the
 * crew-gated approved→ready step, that no un-overridden crew member blocks.
 * Recording the approval also captures the external application fields.
 */
export async function transitionMission(
  ctx: TenantCtx,
  id: string,
  to: MissionState,
  roles: string[],
  extra?: { authority?: string; applicationRef?: string; submittedAt?: Date; authorizationType?: string; authorizationRef?: string },
) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [m] = await tx.select().from(missions).where(and(eq(missions.orgId, ctx.orgId), eq(missions.id, id))).limit(1);
    if (!m) throw new Error("mission not found");
    const t = transitionFor(m.status as MissionState, to, roles);
    if (!t) throw new Error(`Not permitted: ${m.status} → ${to}`);
    if (t.crewGate) {
      const r = await readinessFor(ctx.orgId, m);
      if (r.blocked) throw new Error(`Crew gate failed: ${r.blockingCrew.join(", ")} not fit (override required)`);
    }
    const patch: Partial<typeof missions.$inferInsert> = { status: to, updatedAt: new Date() };
    if (to === "approved") {
      patch.authority = extra?.authority ?? m.authority;
      patch.applicationRef = extra?.applicationRef ?? m.applicationRef;
      patch.submittedAt = extra?.submittedAt ?? m.submittedAt;
      patch.authorizationType = extra?.authorizationType ?? m.authorizationType;
      patch.authorizationRef = extra?.authorizationRef ?? m.authorizationRef;
    }
    await tx.update(missions).set(patch).where(eq(missions.id, id));
    await audit(tx, ctx, { action: "mission.transition", entityType: "mission", entityId: id, before: { status: m.status }, after: { status: to } });
  });
}

export async function assignCrew(ctx: TenantCtx, missionId: string, personId: string, role: string) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [c] = await tx.insert(missionCrew).values({ orgId: ctx.orgId, missionId, personId, role }).onConflictDoNothing().returning();
    await audit(tx, ctx, { action: "mission_crew.assign", entityType: "mission", entityId: missionId, after: { personId, role } });
    return c;
  });
}

export async function overrideCrew(ctx: TenantCtx, missionCrewId: string, reason: string, overriddenByPersonId?: string) {
  if (!reason.trim()) throw new Error("An override requires a reason");
  return withTenant(getAdminDb(), ctx, async (tx) => {
    await tx
      .update(missionCrew)
      .set({ overrideReason: reason, overriddenByPersonId, overriddenAt: new Date(), updatedAt: new Date() })
      .where(and(eq(missionCrew.orgId, ctx.orgId), eq(missionCrew.id, missionCrewId)));
    await audit(tx, ctx, { action: "mission_crew.override", entityType: "mission_crew", entityId: missionCrewId, after: { reason } });
  });
}

export async function addLocation(
  ctx: TenantCtx,
  missionId: string,
  loc: { governorate?: string; wilayat?: string; village?: string; latitude?: number; longitude?: number; ceilingM?: number },
) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    await tx.insert(missionLocations).values({
      orgId: ctx.orgId,
      missionId,
      governorate: loc.governorate,
      wilayat: loc.wilayat,
      village: loc.village,
      latitude: loc.latitude != null ? String(loc.latitude) : null,
      longitude: loc.longitude != null ? String(loc.longitude) : null,
      ceilingM: loc.ceilingM != null ? String(loc.ceilingM) : null,
    });
    await audit(tx, ctx, { action: "mission_location.add", entityType: "mission", entityId: missionId, after: loc });
  });
}

/** Parse a KML AOI into permitted-location rows (lat/long). KMZ deferred. */
export async function importLocationsFromKml(ctx: TenantCtx, missionId: string, kml: string) {
  const parsed = parseKml(kml);
  return withTenant(getAdminDb(), ctx, async (tx) => {
    for (const l of parsed.locations) {
      await tx.insert(missionLocations).values({
        orgId: ctx.orgId,
        missionId,
        village: l.name,
        latitude: String(l.latitude),
        longitude: String(l.longitude),
      });
    }
    await audit(tx, ctx, { action: "mission_location.import_kml", entityType: "mission", entityId: missionId, after: { count: parsed.locations.length, warnings: parsed.warnings } });
    return parsed;
  });
}

export async function addMissionDocument(
  ctx: TenantCtx,
  input: { missionId: string; fileId: string; flow: "inbound" | "outbound"; kind: string; label?: string },
) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    await tx.insert(missionDocuments).values({ orgId: ctx.orgId, missionId: input.missionId, fileId: input.fileId, flow: input.flow, kind: input.kind, label: input.label });
    await audit(tx, ctx, { action: "mission_document.add", entityType: "mission", entityId: input.missionId, after: { flow: input.flow, kind: input.kind } });
  });
}

export async function confirmGreenZone(ctx: TenantCtx, missionId: string, personId: string) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    await tx
      .update(missions)
      .set({ greenZoneConfirmedByPersonId: personId, greenZoneConfirmedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(missions.orgId, ctx.orgId), eq(missions.id, missionId)));
    await audit(tx, ctx, { action: "mission.green_zone_confirm", entityType: "mission", entityId: missionId, after: { personId } });
  });
}
