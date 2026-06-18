import { describe, it, expect } from "vitest";
import { detectDjiFlightRecord, parseDjiFlightRecord } from "./dji";

/** A buffer shaped like a DJI flight record: 8-byte LE detail offset + body. */
function djiLike(detailOffset: number, length: number): Uint8Array {
  const b = new Uint8Array(length);
  new DataView(b.buffer).setBigUint64(0, BigInt(detailOffset), true);
  b[8] = 0xb4; // non-text version bytes (mirrors a real sample)
  return b;
}

describe("DJI flight-record detection", () => {
  it("detects a DJI record by its leading detail offset", () => {
    const det = detectDjiFlightRecord(djiLike(809, 2048));
    expect(det.isDji).toBe(true);
    expect(det.detailOffset).toBe(809);
  });

  it("rejects plain text (CSV/JSON)", () => {
    const text = new TextEncoder().encode("timestamp,lat,lng\n1,2,3\n".padEnd(64, " "));
    expect(detectDjiFlightRecord(text).isDji).toBe(false);
  });

  it("rejects an offset past the end of the file", () => {
    expect(detectDjiFlightRecord(djiLike(999999, 128)).isDji).toBe(false);
  });
});

describe("parseDjiFlightRecord", () => {
  it("reports needs_key when no decryptor is wired", async () => {
    const r = await parseDjiFlightRecord(djiLike(809, 2048));
    expect(r.status).toBe("needs_key");
  });

  it("reports unsupported for non-DJI input", async () => {
    const r = await parseDjiFlightRecord(new TextEncoder().encode("hello world this is not a drone log"));
    expect(r.status).toBe("unsupported");
  });

  it("parses via an injected decryptor", async () => {
    const r = await parseDjiFlightRecord(djiLike(809, 2048), {
      decryptor: async () => ({ durationS: 120, maxAltitudeM: 80 }),
    });
    expect(r.status).toBe("parsed");
    expect(r.flight?.durationS).toBe(120);
  });
});
