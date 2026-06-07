/**
 * Flight-log parser (M6). Normalizes a telemetry log into a ParsedFlight the
 * ingestion path stores and the jurisdiction engine evaluates. Built and tested
 * against SYNTHETIC fixtures; a column-mapping CSV reader handles the DJI flight-
 * record / Airdata CSV export shape. The encrypted DJI .DAT binary decoder is
 * stubbed (`parseDjiDat`) — that path, and validation of THIS parser against real
 * DJI logs, is the one step held until real logs arrive.
 *
 * Pure: no DB, no IO. The caller reads the file (content-addressed) and passes
 * its text here.
 */

export interface TrackPoint {
  /** Epoch ms. */
  t: number;
  lat: number;
  lon: number;
  altitudeM: number;
}

export interface ParsedFlight {
  source: string;
  sampleCount: number;
  startedAt: Date;
  endedAt: Date;
  durationSec: number;
  /** Airborne time (sum of in-air intervals) — feeds the OSO#17 block-time rule. */
  blockTimeSec: number;
  maxAltitudeM: number;
  /** Max straight-line distance from the first GPS fix (home point). */
  maxDistanceM: number;
  /** Path length over the ground. */
  totalDistanceM: number;
  minBatteryPct: number | null;
  track: TrackPoint[];
  warnings: string[];
}

// Column aliases (lower-cased, punctuation-stripped) → canonical field.
const ALIASES: Record<string, string[]> = {
  time: ["time", "timestamp", "datetime", "timemillisecond", "custstamp"],
  lat: ["latitude", "lat", "osdlatitude"],
  lon: ["longitude", "lon", "lng", "osdlongitude"],
  altitudeM: ["altitudem", "altitude", "heightm", "height", "osdheight"],
  speedMs: ["speedms", "speed", "osdhspeed", "hspeed"],
  batteryPct: ["batterypct", "battery", "batterypercent", "batterypower"],
  inAir: ["inair", "isflying", "isflying01", "flying"],
};

const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

function buildColumnMap(header: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  header.forEach((h, i) => {
    const n = norm(h);
    for (const [field, aliases] of Object.entries(ALIASES)) {
      if (aliases.includes(n)) map[field] = i;
    }
  });
  return map;
}

/** Split a CSV line respecting double-quoted fields. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

function parseTime(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    // Heuristic: 13-digit = ms, 10-digit = seconds.
    return s.length >= 13 ? n : n * 1000;
  }
  const d = Date.parse(s);
  return Number.isNaN(d) ? null : d;
}

const EARTH_M = 6_371_000;
function haversineM(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

const num = (v: string | undefined): number | null => {
  if (v == null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Parse a telemetry CSV (DJI flight-record / Airdata export shape) into a
 * ParsedFlight. Rows without a parseable timestamp are skipped; rows without a
 * GPS fix still count for altitude/battery/time but are excluded from the track
 * and distance.
 */
export function parseFlightCsv(csv: string, source = "dji-csv"): ParsedFlight {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) throw new Error("flight log has no data rows");
  const header = splitCsvLine(lines[0]!);
  const col = buildColumnMap(header);
  const warnings: string[] = [];
  if (col.time == null) throw new Error("flight log has no recognizable time column");

  interface Row {
    t: number;
    lat: number | null;
    lon: number | null;
    altitudeM: number;
    batteryPct: number | null;
    inAir: boolean;
  }
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const f = splitCsvLine(lines[i]!);
    const t = parseTime(f[col.time!] ?? "");
    if (t == null) continue;
    const lat = col.lat != null ? num(f[col.lat]) : null;
    const lon = col.lon != null ? num(f[col.lon]) : null;
    const altitudeM = (col.altitudeM != null ? num(f[col.altitudeM]) : null) ?? 0;
    const batteryPct = col.batteryPct != null ? num(f[col.batteryPct]) : null;
    const inAirRaw = col.inAir != null ? f[col.inAir]?.trim().toLowerCase() : undefined;
    const inAir =
      inAirRaw != null
        ? inAirRaw === "1" || inAirRaw === "true" || inAirRaw === "yes"
        : altitudeM > 0.5; // fall back to altitude when no explicit flag
    rows.push({ t, lat: lat != null && lon != null ? lat : null, lon: lat != null && lon != null ? lon : null, altitudeM, batteryPct, inAir });
  }
  if (rows.length === 0) throw new Error("flight log has no rows with a valid timestamp");
  rows.sort((a, b) => a.t - b.t);

  const startedAt = new Date(rows[0]!.t);
  const endedAt = new Date(rows[rows.length - 1]!.t);
  const durationSec = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));

  let blockMs = 0;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i - 1]!.inAir) blockMs += rows[i]!.t - rows[i - 1]!.t;
  }

  const track: TrackPoint[] = rows
    .filter((r) => r.lat != null && r.lon != null)
    .map((r) => ({ t: r.t, lat: r.lat!, lon: r.lon!, altitudeM: r.altitudeM }));
  if (track.length === 0) warnings.push("no GPS fixes in log — distance not computed");
  if (col.batteryPct == null) warnings.push("no battery column in log");

  const home = track[0];
  let maxDistanceM = 0;
  let totalDistanceM = 0;
  for (let i = 0; i < track.length; i++) {
    if (home) maxDistanceM = Math.max(maxDistanceM, haversineM(home, track[i]!));
    if (i > 0) totalDistanceM += haversineM(track[i - 1]!, track[i]!);
  }

  const batteries = rows.map((r) => r.batteryPct).filter((b): b is number => b != null);
  const altitudes = rows.map((r) => r.altitudeM);

  return {
    source,
    sampleCount: rows.length,
    startedAt,
    endedAt,
    durationSec,
    blockTimeSec: Math.round(blockMs / 1000),
    maxAltitudeM: Math.max(0, ...altitudes),
    maxDistanceM: Math.round(maxDistanceM),
    totalDistanceM: Math.round(totalDistanceM),
    minBatteryPct: batteries.length ? Math.min(...batteries) : null,
    track,
    warnings,
  };
}

/**
 * Encrypted DJI .DAT binary decoder — NOT YET IMPLEMENTED. The binary layout is
 * verified against real logs, so this is the one piece held until the DJI logs
 * arrive (the rest of M6 runs on the CSV path + synthetic fixtures).
 */
export function parseDjiDat(_buffer: Uint8Array): ParsedFlight {
  throw new Error(
    "DJI .DAT decoding is pending validation against real logs — use the CSV flight-record export for now",
  );
}
