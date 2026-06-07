import { pgTable, text, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { orgId, primaryId } from "./_shared";
import { tenantPolicies } from "./rls";
import { persons } from "./persons";

/**
 * E-signatures (CLAUDE.md / BUILD_PLAN): signature = fresh re-auth + meaning
 * string + SHA-256 of the canonical JSON of the signed payload. Immutable
 * (append-only trigger), same proof pattern as audit_events. signer is a
 * person; rendered on records and PDFs (SignatureBlock).
 */
export const signatures = pgTable(
  "signatures",
  {
    id: primaryId(),
    orgId: orgId(),
    signerPersonId: uuid("signer_person_id").references(() => persons.id),
    meaning: text("meaning").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    payloadHash: text("payload_hash").notNull(),
    method: text("method").$type<"password" | "passkey">().notNull(),
    credentialId: text("credential_id"), // passkey credential, when method=passkey
    signedAt: timestamp("signed_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("signatures_entity_idx").on(t.orgId, t.entityType, t.entityId),
    ...tenantPolicies("signatures"),
  ],
).enableRLS();
