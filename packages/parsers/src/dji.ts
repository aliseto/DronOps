/**
 * DJI flight-record (.txt) handling. The file layout begins with an 8-byte
 * little-endian offset to the "detail" area, followed by record/version data.
 * From v13 the records + detail are AES-encrypted and require a keychain fetched
 * via the DJI Open API (App/SDK key) — so decryption is injected, not bundled.
 *
 * This module does the dependency-free, testable part: format detection and the
 * normalised flight shape. The actual decrypt/parse is supplied by the host
 * (an Edge/job function with the DJI key); absent it, parsing reports `needs_key`.
 */

export interface NormalizedFlight {
  startedAt?: string;
  endedAt?: string;
  durationS?: number;
  maxAltitudeM?: number;
  maxDistanceM?: number;
  maxSpeedMs?: number;
  isNight?: boolean;
  /** GeoJSON/KML track ref or inline track, when decoded. */
  track?: unknown;
}

export type ParseStatus = "parsed" | "needs_key" | "unsupported" | "error";

export interface ParseResult {
  status: ParseStatus;
  flight?: NormalizedFlight;
  error?: string;
}

export interface DjiDetection {
  isDji: boolean;
  /** Offset (bytes) to the detail area, from the 8-byte LE header. */
  detailOffset: number;
}

function readUInt64LE(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Number(view.getBigUint64(0, true));
}

/**
 * Detect a DJI flight record: the leading 8-byte LE value is the detail-area
 * offset, which must sit within the file and past the header. Plain text
 * (CSV/JSON/etc.) is rejected.
 */
export function detectDjiFlightRecord(bytes: Uint8Array): DjiDetection {
  if (bytes.byteLength < 16) return { isDji: false, detailOffset: 0 };
  const detailOffset = readUInt64LE(bytes.subarray(0, 8));
  const plausible = detailOffset > 12 && detailOffset <= bytes.byteLength;
  // Binary signal: a text format (CSV/JSON) has no NUL bytes in its header,
  // whereas the DJI record's 8-byte LE offset + version block does.
  const hasNul = bytes.subarray(0, 16).includes(0);
  return { isDji: plausible && hasNul, detailOffset };
}

/**
 * The keychain decryptor supplied by the host (uses the DJI Open API key to
 * fetch the keychain, then decrypts + decodes to a normalised flight).
 */
export type DjiDecryptor = (bytes: Uint8Array, detailOffset: number) => Promise<NormalizedFlight>;

export interface ParseOptions {
  decryptor?: DjiDecryptor;
}

/** Detect then (if a decryptor is wired) decode a DJI flight record. */
export async function parseDjiFlightRecord(bytes: Uint8Array, opts: ParseOptions = {}): Promise<ParseResult> {
  const det = detectDjiFlightRecord(bytes);
  if (!det.isDji) return { status: "unsupported", error: "Not a recognised DJI flight record" };
  if (!opts.decryptor) {
    return { status: "needs_key", error: "DJI Open API key not configured — log stored, awaiting decryption" };
  }
  try {
    const flight = await opts.decryptor(bytes, det.detailOffset);
    return { status: "parsed", flight };
  } catch (e) {
    return { status: "error", error: e instanceof Error ? e.message : "Parse failed" };
  }
}
