/**
 * KML → permitted-location rows (M4). Extracts each Placemark's name and a
 * representative lat/long (the point, or a polygon/line centroid) so an AOI maps
 * to the Oman per-location structure (governorate/wilayat/village + lat/long).
 *
 * KMZ is a ZIP containing doc.kml; unzipping needs a zip dependency, deferred —
 * `parseKml` detects a KMZ/zip payload and asks for the extracted .kml.
 *
 * Regex-based (no XML dependency); KML coordinates are `lon,lat[,alt]` tuples,
 * whitespace-separated.
 */

export interface KmlLocation {
  name: string | null;
  latitude: number;
  longitude: number;
}

export interface ParsedKml {
  locations: KmlLocation[];
  warnings: string[];
}

function parseCoordinateBlock(block: string): { lat: number; lon: number }[] {
  const pts: { lat: number; lon: number }[] = [];
  for (const tok of block.trim().split(/\s+/)) {
    const parts = tok.split(",");
    if (parts.length < 2) continue;
    const lon = Number(parts[0]);
    const lat = Number(parts[1]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) pts.push({ lat, lon });
  }
  return pts;
}

const centroid = (pts: { lat: number; lon: number }[]) => ({
  lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
  lon: pts.reduce((s, p) => s + p.lon, 0) / pts.length,
});

const decodeXml = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();

/** Parse a KML document's placemarks into location rows. */
export function parseKml(kml: string): ParsedKml {
  // Reject a KMZ/zip payload (PK\x03\x04) with a clear message.
  if (kml.charCodeAt(0) === 0x50 && kml.charCodeAt(1) === 0x4b) {
    throw new Error("This looks like a KMZ (zipped). Unzip it and upload the .kml file — KMZ support is coming.");
  }
  const warnings: string[] = [];
  const locations: KmlLocation[] = [];

  const placemarkRe = /<Placemark\b[^>]*>([\s\S]*?)<\/Placemark>/gi;
  let m: RegExpExecArray | null;
  while ((m = placemarkRe.exec(kml)) !== null) {
    const body = m[1]!;
    const nameMatch = body.match(/<name\b[^>]*>([\s\S]*?)<\/name>/i);
    const name = nameMatch ? decodeXml(nameMatch[1]!) || null : null;
    const pts: { lat: number; lon: number }[] = [];
    const coordRe = /<coordinates\b[^>]*>([\s\S]*?)<\/coordinates>/gi;
    let c: RegExpExecArray | null;
    while ((c = coordRe.exec(body)) !== null) pts.push(...parseCoordinateBlock(c[1]!));
    if (pts.length === 0) continue;
    const rep = pts.length === 1 ? pts[0]! : centroid(pts);
    locations.push({ name, latitude: Number(rep.lat.toFixed(6)), longitude: Number(rep.lon.toFixed(6)) });
  }

  if (locations.length === 0) warnings.push("no placemarks with coordinates found in the KML");
  return { locations, warnings };
}
