import "server-only";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { payloadHash } from "@dronops/shared";
import { getAdminDb, mutate } from "@dronops/db";
import { signatures, users } from "@dronops/db/schema";

type SignatureRow = typeof signatures.$inferSelect;

/** Fresh password re-auth — the password-method proof for a signature. */
export async function verifyPassword(userId: string, password: string): Promise<boolean> {
  const [u] = await getAdminDb()
    .select({ hash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u?.hash) return false;
  return bcrypt.compare(password, u.hash);
}

export interface SignInput {
  signerPersonId?: string;
  meaning: string;
  entityType: string;
  entityId?: string;
  /** Canonicalized + SHA-256'd to form payload_hash. */
  payload: unknown;
  method: "password" | "passkey";
  credentialId?: string;
}

/**
 * Records an immutable signature (meaning + SHA-256 of canonical payload). The
 * caller has already proven re-auth (verifyPassword or verifyFreshPasskey) and
 * role-gated the action (requireRole). Audited.
 */
export async function recordSignature(
  ctx: { orgId: string; userId: string },
  input: SignInput,
): Promise<SignatureRow> {
  const hash = await payloadHash(input.payload);
  return mutate<SignatureRow>(
    getAdminDb(),
    ctx,
    (s) => ({
      action: "signature.create",
      entityType: "signature",
      entityId: s.id,
      after: { meaning: input.meaning, payloadHash: hash, entityType: input.entityType },
      amr: input.method === "passkey" ? "webauthn" : "password",
    }),
    async (tx) => {
      const [s] = await tx
        .insert(signatures)
        .values({
          orgId: ctx.orgId,
          signerPersonId: input.signerPersonId,
          meaning: input.meaning,
          entityType: input.entityType,
          entityId: input.entityId,
          payloadHash: hash,
          method: input.method,
          credentialId: input.credentialId,
        })
        .returning();
      if (!s) throw new Error("signature insert failed");
      return s;
    },
  );
}
