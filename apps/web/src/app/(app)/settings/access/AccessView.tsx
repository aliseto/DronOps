"use client";

import { useState, useTransition } from "react";
import { Badge, Button, Card, Checkbox, Input } from "@dronops/ui";
import { ensurePersonAction, grantRoleAction, revokeRoleAction } from "./actions";

interface AccessRow {
  membershipId: string;
  email: string;
  membershipRole: string;
  status: string;
  userId: string | null;
  personId: string | null;
  personName: string | null;
  roles: string[];
}

/**
 * One row per member: platform role + the link-to-person + domain-role toggles.
 * Domain roles are only editable once the member has an operational person
 * (the link), so the flow is: accept invite → create/link person → grant roles.
 */
export function AccessView({
  rows,
  allRoles,
}: {
  rows: AccessRow[];
  allRoles: { value: string; label: string }[];
}) {
  return (
    <Card title="Members">
      <ul className="flex flex-col">
        {rows.map((row) => (
          <MemberRow key={row.membershipId} row={row} allRoles={allRoles} />
        ))}
        {rows.length === 0 && (
          <li className="py-2 text-small text-fg-muted">No members yet.</li>
        )}
      </ul>
    </Card>
  );
}

function MemberRow({ row, allRoles }: { row: AccessRow; allRoles: { value: string; label: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(row.personName ?? "");
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      setError(null);
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      }
    });

  return (
    <li className="flex flex-col gap-2 border-b border-subtle py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-fg-primary">{row.email}</span>
        <Badge tone="neutral">{row.membershipRole}</Badge>
        {row.status === "invited" && <Badge tone="accent">invited</Badge>}
        {row.personName && <span className="text-micro text-fg-muted">→ {row.personName}</span>}
      </div>

      {row.status === "invited" || !row.userId ? (
        <p className="text-micro text-fg-muted">Pending invite — roles can be assigned once they sign in.</p>
      ) : !row.personId ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-small text-fg-secondary">
            Full name
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ali Seto" />
          </label>
          <Button
            size="sm"
            disabled={pending || !name.trim()}
            onClick={() => run(() => ensurePersonAction(row.userId!, name, row.email))}
          >
            Create person &amp; link
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {allRoles.map((r) => {
            const has = row.roles.includes(r.value);
            return (
              <Checkbox
                key={r.value}
                label={r.label}
                checked={has}
                disabled={pending}
                onChange={() =>
                  run(() =>
                    has
                      ? revokeRoleAction(row.personId!, r.value)
                      : grantRoleAction(row.personId!, r.value),
                  )
                }
              />
            );
          })}
        </div>
      )}
      {error && <p className="text-micro text-status-danger-fg">{error}</p>}
    </li>
  );
}
