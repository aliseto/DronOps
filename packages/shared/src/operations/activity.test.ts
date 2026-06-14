import { describe, it, expect } from "vitest";
import { interleaveActivity, type ActivityEntry } from "./activity";

const note = (id: string, at: string): ActivityEntry => ({ id, kind: "note", action: "Note", actor: "Sara", at, body: "b" });
const event = (id: string, at: string, action = "mission.transition"): ActivityEntry => ({ id, kind: "event", action, actor: "u1", at });

describe("interleaveActivity", () => {
  it("merges notes and events newest first", () => {
    const out = interleaveActivity(
      [note("n1", "2026-06-02T10:00:00Z"), note("n2", "2026-06-05T10:00:00Z")],
      [event("e1", "2026-06-03T10:00:00Z"), event("e2", "2026-06-01T10:00:00Z")],
    );
    expect(out.map((x) => x.id)).toEqual(["n2", "e1", "n1", "e2"]);
  });

  it("drops the note_added audit twin (the note row is shown instead)", () => {
    const out = interleaveActivity([note("n1", "2026-06-02T10:00:00Z")], [event("e1", "2026-06-02T10:00:01Z", "mission.note_added")]);
    expect(out.map((x) => x.id)).toEqual(["n1"]);
  });

  it("keeps other audit actions", () => {
    const out = interleaveActivity([], [event("e1", "2026-06-02T10:00:00Z", "mission_crew.override")]);
    expect(out).toHaveLength(1);
  });
});
