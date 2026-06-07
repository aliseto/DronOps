import { z } from "zod";
import { JURISDICTION_KEYS, type JurisdictionKey } from "./jurisdictions";

/**
 * Credential wallet vocabulary (DRO-REG-001 §7 + §13). Each kind is a distinct
 * credential a person holds, bound to the issuing authority and (where it is a
 * jurisdiction-specific instrument) one jurisdiction. This is CONTENT, not app
 * logic — the currency engine reads these; nothing about a credential kind is
 * hardcoded in app code.
 *
 * `category` drives how the wallet renders and how the engine treats it:
 *   licence/certificate/endorsement/registration → operator-verified external
 *     instruments with an expiry the alert windows track;
 *   medical → the Oman fit-to-fly gate (CAR 102.185), expiry-tracked.
 *
 * Recency (operator ≥3/90d, KSA knowledge §107.71) is event-driven, not a wallet
 * credential — see rules/currency.ts + recency_events. The recency gate is
 * surfaced as a readiness check, not a wallet card.
 */
export const CREDENTIAL_CATEGORIES = [
  "licence",
  "certificate",
  "endorsement",
  "registration",
  "medical",
] as const;
export type CredentialCategory = (typeof CREDENTIAL_CATEGORIES)[number];

const schema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  category: z.enum(CREDENTIAL_CATEGORIES),
  /** Jurisdiction the instrument belongs to, or null for cross-jurisdiction. */
  jurisdiction: z.enum(JURISDICTION_KEYS).nullable(),
  authority: z.string().min(1),
  clause: z.string().min(1),
  /** Most instruments expire; some endorsements are standing (no expiry). */
  expires: z.boolean(),
});
export type CredentialKindDef = z.infer<typeof schema>;

export const CREDENTIAL_KINDS: CredentialKindDef[] = [
  {
    code: "gcaa_uav_pilot_licence",
    label: "GCAA UA Pilot Licence",
    category: "licence",
    jurisdiction: "UAE-Federal",
    authority: "GCAA",
    clause: "UAC.020",
    expires: true,
  },
  {
    code: "dcaa_personnel_registration",
    label: "DCAA personnel registration",
    category: "registration",
    jurisdiction: "UAE-Dubai",
    authority: "DCAA · DUOSAM",
    clause: "DCAR-UAS / DUOSAM",
    expires: true,
  },
  {
    code: "ksa_rpc",
    label: "Remote Pilot Certificate",
    category: "certificate",
    jurisdiction: "KSA",
    authority: "GACA",
    clause: "§107.63–85",
    expires: true,
  },
  {
    code: "ksa_endorsement",
    label: "Specific RPC endorsement",
    category: "endorsement",
    jurisdiction: "KSA",
    authority: "GACA",
    clause: "§107.91–92",
    expires: false,
  },
  {
    code: "oman_rp_certification",
    label: "Remote Pilot certification",
    category: "certificate",
    jurisdiction: "Oman",
    authority: "CAA",
    clause: "CAR-102 Subpart D",
    expires: true,
  },
  {
    code: "oman_rpl",
    label: "Remote Pilot Licence",
    category: "licence",
    jurisdiction: "Oman",
    authority: "CAA",
    clause: "CAR-102 Subpart E",
    expires: true,
  },
  {
    code: "medical",
    label: "Medical certificate",
    category: "medical",
    jurisdiction: "Oman",
    authority: "CAA",
    clause: "CAR 102.185",
    expires: true,
  },
];

for (const k of CREDENTIAL_KINDS) schema.parse(k);

const byCode = new Map(CREDENTIAL_KINDS.map((k) => [k.code, k]));
export const getCredentialKind = (code: string): CredentialKindDef | undefined => byCode.get(code);

/** Credential kinds offered when the given jurisdictions are enabled (+ cross). */
export function credentialKindsForJurisdictions(enabled: readonly string[]): CredentialKindDef[] {
  const set = new Set<string>(enabled);
  return CREDENTIAL_KINDS.filter((k) => k.jurisdiction === null || set.has(k.jurisdiction));
}

export const isJurisdictionKeyForCredential = (v: string): v is JurisdictionKey =>
  (JURISDICTION_KEYS as readonly string[]).includes(v);
