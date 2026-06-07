/**
 * Canonical JSON + SHA-256 — the basis of the e-signature proof and
 * content-addressed files. Uses Web Crypto (available in Node 22 and browsers).
 */

/** Deterministic JSON: object keys sorted recursively, so equal payloads hash equal. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortValue);
  if (v && typeof v === "object") {
    return Object.keys(v as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortValue((v as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return v;
}

/** Lowercase hex SHA-256 of a string or bytes. */
export async function sha256Hex(data: Uint8Array | string): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  // Copy into a fresh ArrayBuffer so the type is unambiguously BufferSource.
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", ab);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** SHA-256 of the canonical JSON of a payload — the signature payload_hash. */
export async function payloadHash(payload: unknown): Promise<string> {
  return sha256Hex(canonicalJson(payload));
}
