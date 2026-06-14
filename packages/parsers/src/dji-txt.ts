import { DJILog } from "dji-log-parser-js";
import type { ParsedFlight, TrackPoint } from "./flight-log";

/**
 * Native DJI Fly `.txt` flight-record ingestion (M6 real-log path). Container
 * and frame decoding via dji-log-parser-js (MIT — the JS bindings of the
 * reference Rust implementation). Records v13+ are AES-encrypted by DJI: frame
 * decryption requires per-file keychains fetched from DJI's keychain API with
 * a DJI Developer API key (env DJI_API_KEY). Flight DETAILS (start time,
 * record count) are plaintext and readable without a key.
 *
 * Container detection + plaintext details validated against real DJI Fly
 * records (v14, Dec 2025 / Feb 2026 fleet logs). Frame decode awaits the
 * DJI_API_KEY provisioning (flagged) — the mapping below follows the library's
 * documented frame schema and fails loudly, never silently.
 */

export interface DjiTxtDetection {
  isDjiTxt: boolean;
  version: number | null;
  /** v13+ — frames are AES-encrypted; a DJI API key is required to decode. */
  encrypted: boolean;
}

/** Cheap prefix sniff (no WASM): u64 LE detail-offset within file + sane version byte. */
export function detectDjiFlightRecord(bytes: Uint8Array): DjiTxtDetection {
  if (bytes.length < 100) return { isDjiTxt: false, version: null, encrypted: false };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const detailOffset = view.getBigUint64(0, true);
  const version = bytes[10]!;
  const plausible =
    detailOffset > 0n && detailOffset < BigInt(bytes.length) && version >= 1 && version <= 30;
  if (!plausible) return { isDjiTxt: false, version: null, encrypted: false };
  return { isDjiTxt: true, version, encrypted: version >= 13 };
}

export interface ParseDjiTxtOptions {
  /** DJI Developer API key (env DJI_API_KEY) — required for v13+ records. */
  apiKey?: string;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * Decode a DJI `.txt` record into the M6 ParsedFlight shape (same derivations
 * as the CSV path). Throws operator-actionable errors — never a raw parse error.
 */
export async function parseDjiTxt(
  bytes: Uint8Array,
  opts: ParseDjiTxtOptions = {},
): Promise<ParsedFlight> {
  const det = detectDjiFlightRecord(bytes);
  if (!det.isDjiTxt) {
    throw new Error("not a DJI flight record (.txt) — upload the log as exported by DJI Fly, or a CSV");
  }
  if (det.encrypted && !opts.apiKey) {
    throw new Error(
      `encrypted DJI flight record (v${det.version}): configure DJI_API_KEY, or upload an Airdata/CSV export`,
    );
  }

  const log = new DJILog(bytes);
  const warnings: string[] = [];
  const keychains = det.encrypted ? await log.fetchKeychains(opts.apiKey!) : undefined;
  const frames = log.frames(keychains);

  interface Row {
    t: number;
    lat: number | null;
    lon: number | null;
    altitudeM: number;
    batteryPct: number | null;
    inAir: boolean;
  }
  const rows: Row[] = [];
  for (const f of frames) {
    const t = Date.parse(f.custom.dateTime);
    if (Number.isNaN(t)) continue;
    const altitudeM = num(f.osd.height) ?? 0;
    rows.push({
      t,
      lat: num(f.osd.latitude),
      lon: num(f.osd.longitude),
      altitudeM,
      batteryPct: num(f.battery.chargeLevel),
      inAir: altitudeM > 0.5,
    });
  }
  if (rows.length === 0) throw new Error("DJI record decoded but contained no usable telemetry frames");
  if (rows.length !== frames.length) warnings.push(`${frames.length - rows.length} frames lacked a timestamp and were skipped`);
  rows.sort((a, b) => a.t - b.t);

  const startedAt = new Date(rows[0]!.t);
  const endedAt = new Date(rows[rows.length - 1]!.t);
  let blockMs = 0;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i - 1]!.inAir) blockMs += rows[i]!.t - rows[i - 1]!.t;
  }

  const track: TrackPoint[] = rows
    .filter((r) => r.lat != null && r.lon != null)
    .map((r) => ({ t: r.t, lat: r.lat!, lon: r.lon!, altitudeM: r.altitudeM }));
  if (track.length === 0) warnings.push("no GPS fixes in log — distance not computed");

  const home = track[0];
  let maxDistanceM = 0;
  let totalDistanceM = 0;
  for (let i = 0; i < track.length; i++) {
    if (home) maxDistanceM = Math.max(maxDistanceM, haversineM(home, track[i]!));
    if (i > 0) totalDistanceM += haversineM(track[i - 1]!, track[i]!);
  }
  const batteries = rows.map((r) => r.batteryPct).filter((b): b is number => b != null);
  if (batteries.length === 0) warnings.push("no battery telemetry in log");

  return {
    source: "dji-txt",
    sampleCount: rows.length,
    startedAt,
    endedAt,
    durationSec: Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)),
    blockTimeSec: Math.round(blockMs / 1000),
    maxAltitudeM: Math.max(0, ...rows.map((r) => r.altitudeM)),
    maxDistanceM: Math.round(maxDistanceM),
    totalDistanceM: Math.round(totalDistanceM),
    minBatteryPct: batteries.length ? Math.min(...batteries) : null,
    track,
    warnings,
  };
}

/** Plaintext details (no key needed) — start time + record count for triage/UI. */
export function readDjiTxtDetails(bytes: Uint8Array): { startTime: string | null; recordCount: number | null } {
  const log = new DJILog(bytes);
  const d = log.details as { startTime?: string; recordLineCount?: number };
  return { startTime: d.startTime ?? null, recordCount: d.recordLineCount ?? null };
}

function haversineM(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
