import { and, eq, isNull } from "drizzle-orm";
import { schema } from "@dom/db";
import { withRls } from "@/lib/db";
import { claimsOf, type ActiveContext } from "./context";

export function listPersonnel(ctx: ActiveContext) {
  return withRls(claimsOf(ctx), (db) =>
    db.select().from(schema.personnel).where(isNull(schema.personnel.archivedAt)),
  );
}

export function personDetail(ctx: ActiveContext, personId: string) {
  return withRls(claimsOf(ctx), async (db) => {
    const [person] = await db
      .select()
      .from(schema.personnel)
      .where(and(eq(schema.personnel.id, personId), eq(schema.personnel.orgId, ctx.orgId)));
    const certs = await db.select().from(schema.certifications).where(eq(schema.certifications.personnelId, personId));
    const skillLinks = await db.select().from(schema.personnelSkills).where(eq(schema.personnelSkills.personnelId, personId));
    const approved = await db.select().from(schema.approvedAircraft).where(eq(schema.approvedAircraft.personnelId, personId));
    const docs = await db
      .select()
      .from(schema.documents)
      .where(and(eq(schema.documents.ownerType, "personnel"), eq(schema.documents.ownerId, personId)));
    const profiles = await db.select().from(schema.droneProfiles);
    const skillsCatalog = await db.select().from(schema.skills);
    return { person, certs, skillLinks, approved, docs, profiles, skillsCatalog };
  });
}

export type PersonDetail = Awaited<ReturnType<typeof personDetail>>;

export function createPerson(
  ctx: ActiveContext,
  v: { fullName: string; roleTitle?: string; email?: string; employmentType?: string },
) {
  return withRls(claimsOf(ctx), (db) => db.insert(schema.personnel).values({ orgId: ctx.orgId, ...v }));
}

export function addCertification(
  ctx: ActiveContext,
  personId: string,
  v: { type: string; issuer?: string; number?: string; issuedOn?: string; expiresOn?: string },
) {
  return withRls(claimsOf(ctx), (db) =>
    db.insert(schema.certifications).values({ orgId: ctx.orgId, personnelId: personId, ...v }),
  );
}

export function addApprovedAircraft(
  ctx: ActiveContext,
  personId: string,
  v: { droneProfileId: string; dateApproved?: string },
) {
  return withRls(claimsOf(ctx), (db) =>
    db
      .insert(schema.approvedAircraft)
      .values({ orgId: ctx.orgId, personnelId: personId, ...v })
      .onConflictDoNothing(),
  );
}

/** Create a tenant skill (if new) and link it to the person. */
export function addSkill(ctx: ActiveContext, personId: string, v: { category: string; name: string; level?: string }) {
  return withRls(claimsOf(ctx), async (db) => {
    const [skill] = await db
      .insert(schema.skills)
      .values({ tenantId: ctx.tenantId, category: v.category, name: v.name, isCustom: true })
      .returning();
    await db.insert(schema.personnelSkills).values({
      orgId: ctx.orgId,
      personnelId: personId,
      skillId: skill!.id,
      level: v.level,
    });
  });
}

/** Record a document (metadata + expiry; file upload is a later slice). */
export function addDocument(
  ctx: ActiveContext,
  ownerType: string,
  ownerId: string,
  v: { title: string; docType?: string; issuedOn?: string; expiresOn?: string },
) {
  return withRls(claimsOf(ctx), (db) =>
    db.insert(schema.documents).values({ orgId: ctx.orgId, ownerType, ownerId, ...v }),
  );
}

export function archivePerson(ctx: ActiveContext, id: string) {
  return withRls(claimsOf(ctx), (db) =>
    db
      .update(schema.personnel)
      .set({ archivedAt: new Date() })
      .where(and(eq(schema.personnel.id, id), eq(schema.personnel.orgId, ctx.orgId))),
  );
}
