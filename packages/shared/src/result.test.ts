import { describe, it, expect } from "vitest";
import { ok, err, isOk, isErr } from "./result";
import { formatRef } from "./ids";

describe("result", () => {
  it("narrows ok", () => {
    const r = ok(42);
    expect(isOk(r)).toBe(true);
    expect(isErr(r)).toBe(false);
    if (isOk(r)) expect(r.value).toBe(42);
  });

  it("narrows err", () => {
    const r = err("boom");
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error).toBe("boom");
  });
});

describe("formatRef", () => {
  it("zero-pads the sequence", () => {
    expect(formatRef("NCR", 2026, 19)).toBe("NCR-2026-019");
  });
});
