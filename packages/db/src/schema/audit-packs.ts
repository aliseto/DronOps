import { pgTable, text, uuid, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";
import { persons } from "./persons";
import { signatures } from "./signatures";

/**
 * Audit pack (M2 Compliance) — a curated, point-in-time compliance evidence
 * bundle assembled by FREE SELECTION: the preparer picks the frameworks in
 * scope, a period window, and the exact findings / documents / management
 * reviews to include. A dated, append-only record that mirrors the management-
 * review lifecycle.
 *
 * `draft` → the selection (`frameworks`, `selection`, `scopeNotes`) is editable
 * and the printed document renders LIVE from current data. Sealing is a Tier-3
 * ceremony (quality / accountable manager re-auths): it FREEZES `contentSnapshot`
 * (resolved items + coverage + the content-addressed evidence index), binds a
 * signature whose `payloadHash` anchors integrity, and flips status to `sealed`
 * — IMMUTABLE thereafter (enforce_audit_pack_immutability). Corrections = a new
 * pack, never an edit (CLAUDE.md rule 1). The bundle is delivered via the light,
 * paginated print route (cover + sections + evidence index) → print-to-PDF.
 */
export const auditPacks = pgTable(
  "audit_packs",
  {
    id: primaryId(),
    orgId: orgId(),
    code: text("code").notNull(), // AP-001
    title: text("title"),
    status: text("status").$type<"draft" | "sealed">().notNull().default("draft"),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    // Free-selection scope + picks (null === empty; coalesced in the server).
    frameworks: jsonb("frameworks").$type<string[]>(),
    selection: jsonb("selection").$type<{ findingIds: string[]; documentIds: string[]; reviewIds: string[] }>(),
    scopeNotes: text("scope_notes"), // preparer's scope statement / narrative
    // Resolved items + coverage + evidence index, frozen at seal.
    contentSnapshot: jsonb("content_snapshot"),
    // Tier-3 seal (quality / accountable manager).
    sealedByPersonId: uuid("sealed_by_person_id").references(() => persons.id),
    signatureId: uuid("signature_id").references(() => signatures.id),
    sealedAt: timestamp("sealed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index("audit_packs_org_status_idx").on(t.orgId, t.status),
    ...tenantPolicies("audit_packs"),
  ],
).enableRLS();
