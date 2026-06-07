/**
 * Mission activity thread (M4) — the history Timeline made writable. A pure
 * interleave of manual notes and the mission's own audit events, newest first.
 * Not a chat: append-only operational log. The `mission.note_added` audit twin
 * is dropped because the note row itself is rendered.
 */

export interface ActivityEntry {
  id: string;
  kind: "note" | "event";
  action: string;
  actor: string | null;
  at: string; // ISO
  body?: string;
  hasAttachment?: boolean;
}

export function interleaveActivity(notes: ActivityEntry[], events: ActivityEntry[]): ActivityEntry[] {
  return [...notes, ...events.filter((e) => e.action !== "mission.note_added")].sort((a, b) =>
    a.at < b.at ? 1 : a.at > b.at ? -1 : 0,
  );
}
