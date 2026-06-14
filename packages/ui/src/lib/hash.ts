/**
 * SHA-256 helper for content-addressed uploads. Web Crypto (Node 22 + browsers).
 * Kept local to the design system so the kit has no cross-package dependency.
 */

/** Lowercase hex SHA-256 of a string or bytes. */
export async function sha256Hex(data: Uint8Array | string): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  // Copy into a fresh ArrayBuffer so the type is unambiguously BufferSource.
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", ab);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
