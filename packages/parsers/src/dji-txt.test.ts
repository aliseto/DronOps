import { describe, expect, it } from "vitest";
import { detectDjiFlightRecord, parseDjiTxt } from "./dji-txt";

/** Synthetic DJI TXT prefix mirroring real v14 records (u64 LE detail offset
 * 809, version byte 0x0e at offset 10) — real fleet logs are not committed. */
function syntheticPrefix(version = 14, size = 4096): Uint8Array {
  const b = new Uint8Array(size);
  new DataView(b.buffer).setBigUint64(0, 809n, true);
  b[8] = 0xb4;
  b[9] = 0x01;
  b[10] = version;
  return b;
}

describe("detectDjiFlightRecord", () => {
  it("recognizes the v14 encrypted container", () => {
    expect(detectDjiFlightRecord(syntheticPrefix(14))).toEqual({
      isDjiTxt: true,
      version: 14,
      encrypted: true,
    });
  });
  it("treats pre-v13 records as plaintext", () => {
    expect(detectDjiFlightRecord(syntheticPrefix(12))).toEqual({
      isDjiTxt: true,
      version: 12,
      encrypted: false,
    });
  });
  it("rejects CSV/text content", () => {
    const csv = new TextEncoder().encode("time,latitude,longitude\n".repeat(20));
    expect(detectDjiFlightRecord(csv).isDjiTxt).toBe(false);
  });
  it("rejects tiny files", () => {
    expect(detectDjiFlightRecord(new Uint8Array(10)).isDjiTxt).toBe(false);
  });
});

describe("parseDjiTxt", () => {
  it("explains the key requirement for encrypted records instead of a raw error", async () => {
    await expect(parseDjiTxt(syntheticPrefix(14))).rejects.toThrow(/DJI_API_KEY|Airdata/);
  });
  it("rejects non-DJI input with CSV guidance", async () => {
    const csv = new TextEncoder().encode("time,latitude,longitude\n".repeat(20));
    await expect(parseDjiTxt(csv)).rejects.toThrow(/not a DJI flight record/);
  });
});
