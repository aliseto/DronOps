import "server-only";
import { and, eq, lt } from "drizzle-orm";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import { getAdminDb } from "@dronops/db/client";
import { authenticators, webauthnChallenges } from "@dronops/db/schema";

/**
 * Passkey enrollment + signature step-up.
 *
 * This is deliberately NOT a NextAuth login provider: everyday login is
 * email+password. Passkeys exist for the signature ceremony — re-proving "you,
 * right now" when sealing/approving a record. A step-up challenge is persisted
 * bound to the exact record + content hash, so the resulting assertion is
 * non-repudiably tied to that record version (composed into withAudit later).
 */

const CHALLENGE_TTL_MS = 5 * 60_000;

function rp() {
  const rpID = process.env.AUTH_WEBAUTHN_RP_ID ?? "localhost";
  const rpName = process.env.AUTH_WEBAUTHN_RP_NAME ?? "DronOps";
  const origin = process.env.AUTH_URL ?? `https://${rpID}`;
  return { rpID, rpName, origin };
}

async function putChallenge(
  userId: string,
  purpose: "enroll" | "step_up",
  challenge: string,
  record?: { ref: string; hash: string },
) {
  const db = getAdminDb();
  // best-effort GC of expired challenges
  await db.delete(webauthnChallenges).where(lt(webauthnChallenges.expiresAt, new Date()));
  await db.insert(webauthnChallenges).values({
    userId,
    purpose,
    challenge,
    recordRef: record?.ref,
    recordHash: record?.hash,
    expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
  });
}

async function takeChallenge(userId: string, purpose: "enroll" | "step_up") {
  const db = getAdminDb();
  const [row] = await db
    .select()
    .from(webauthnChallenges)
    .where(and(eq(webauthnChallenges.userId, userId), eq(webauthnChallenges.purpose, purpose)))
    .orderBy(webauthnChallenges.createdAt)
    .limit(1);
  if (row) await db.delete(webauthnChallenges).where(eq(webauthnChallenges.id, row.id));
  if (!row || row.expiresAt.getTime() < Date.now()) return null;
  return row;
}

// ---------------------------------------------------------------- enrollment
export async function beginPasskeyEnrollment(user: { id: string; email: string }) {
  const { rpID, rpName } = rp();
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(user.id),
    userName: user.email,
    attestationType: "none",
    authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
  });
  await putChallenge(user.id, "enroll", options.challenge);
  return options;
}

export async function finishPasskeyEnrollment(
  user: { id: string },
  response: RegistrationResponseJSON,
  label?: string,
) {
  const { rpID, origin } = rp();
  const challenge = await takeChallenge(user.id, "enroll");
  if (!challenge) return { verified: false as const };

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });
  if (!verification.verified || !verification.registrationInfo) return { verified: false as const };

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  await getAdminDb()
    .insert(authenticators)
    .values({
      credentialId: credential.id,
      userId: user.id,
      providerAccountId: user.id,
      credentialPublicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      credentialDeviceType,
      credentialBackedUp,
      transports: credential.transports?.join(",") ?? null,
      label: label ?? null,
    });
  return { verified: true as const, credentialId: credential.id };
}

// ----------------------------------------------------------------- step-up
export interface StepUpRequest {
  userId: string;
  recordRef: string;
  recordHash: string;
}

export async function requireFreshPasskey(req: StepUpRequest) {
  const { rpID } = rp();
  const creds = await getAdminDb()
    .select()
    .from(authenticators)
    .where(eq(authenticators.userId, req.userId));

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    allowCredentials: creds.map((c) => ({ id: c.credentialId })),
  });
  await putChallenge(req.userId, "step_up", options.challenge, {
    ref: req.recordRef,
    hash: req.recordHash,
  });
  return options;
}

export interface FreshPasskeyResult {
  verified: boolean;
  credentialId?: string;
  signedChallenge?: string;
  recordRef?: string;
  recordHash?: string;
}

export async function verifyFreshPasskey(
  userId: string,
  response: AuthenticationResponseJSON,
): Promise<FreshPasskeyResult> {
  const { rpID, origin } = rp();
  const challenge = await takeChallenge(userId, "step_up");
  if (!challenge) return { verified: false };

  const db = getAdminDb();
  const [cred] = await db
    .select()
    .from(authenticators)
    .where(and(eq(authenticators.userId, userId), eq(authenticators.credentialId, response.id)))
    .limit(1);
  if (!cred) return { verified: false };

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: cred.credentialId,
      publicKey: Buffer.from(cred.credentialPublicKey, "base64url"),
      counter: cred.counter,
      transports: cred.transports?.split(",") as never,
    },
  });
  if (!verification.verified) return { verified: false };

  // advance the signature counter (clone/replay defense)
  await db
    .update(authenticators)
    .set({ counter: verification.authenticationInfo.newCounter })
    .where(eq(authenticators.credentialId, cred.credentialId));

  return {
    verified: true,
    credentialId: cred.credentialId,
    signedChallenge: challenge.challenge,
    recordRef: challenge.recordRef ?? undefined,
    recordHash: challenge.recordHash ?? undefined,
  };
}
