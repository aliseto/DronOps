import { describe, it, expect } from "vitest";
import { canonicalJson, sha256Hex, payloadHash } from "./hash";

describe("canonicalJson", () => {
  it("sorts keys recursively so equal payloads serialize equally", () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
    expect(canonicalJson({ a: 1, b: 2 })).toBe(canonicalJson({ b: 2, a: 1 }));
  });
});

describe("sha256Hex", () => {
  it("matches known vectors", async () => {
    expect(await sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("payloadHash", () => {
  it("is stable under key order", async () => {
    expect(await payloadHash({ x: 1, y: 2 })).toBe(await payloadHash({ y: 2, x: 1 }));
  });
});
