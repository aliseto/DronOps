"use client";

import { useState } from "react";
import { Badge, Button, Card } from "@dronops/ui";
import { ORG_ROLES, ROLE_LABELS, TENANT_ROLES, type Role } from "@dom/core";
import { inviteAction, revokeAction } from "./actions";

export interface MemberRow {
  id: string;
  email: string;
  scope: string;
  role: string;
}
export interface PendingInvite {
  id: string;
  email: string;
  role: string;
  scope: string;
  tokenHash: string;
  expiresAt: string;
}
export interface OrgOption {
  id: string;
  name: string;
}

const field =
  "rounded-md border border-default bg-inset px-3 py-2 text-small text-fg-primary focus-visible:border-focus";

export function MembersView({
  tenantId,
  orgs,
  members,
  pending,
}: {
  tenantId: string;
  orgs: OrgOption[];
  members: MemberRow[];
  pending: PendingInvite[];
}) {
  const [level, setLevel] = useState<"tenant" | "org">("org");
  const roles: Role[] = level === "tenant" ? [...TENANT_ROLES] : [...ORG_ROLES];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <Card title="Invite a person">
        <form action={inviteAction} className="flex flex-col gap-3">
          <input type="hidden" name="tenantId" value={tenantId} />
          <label className="flex flex-col gap-1 text-small text-fg-secondary">
            Email
            <input name="email" type="email" required placeholder="person@example.com" className={field} />
          </label>
          <label className="flex flex-col gap-1 text-small text-fg-secondary">
            Scope
            <select
              name="level"
              value={level}
              onChange={(e) => setLevel(e.target.value as "tenant" | "org")}
              className={field}
            >
              <option value="org">Organisation</option>
              <option value="tenant">Tenant-wide</option>
            </select>
          </label>
          {level === "org" && (
            <label className="flex flex-col gap-1 text-small text-fg-secondary">
              Organisation
              <select name="orgId" required className={field}>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex flex-col gap-1 text-small text-fg-secondary">
            Role
            <select name="role" className={field}>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <div>
            <Button type="submit">Send invitation</Button>
          </div>
          <p className="text-micro text-fg-muted">
            Generates an invitation link; the invitee accepts it after signing in with the matching email.
          </p>
        </form>
      </Card>

      <div className="flex flex-col gap-4">
        <Card title={`Pending invitations (${pending.length})`}>
          {pending.length === 0 ? (
            <p className="text-small text-fg-muted">No pending invitations.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pending.map((i) => (
                <li
                  key={i.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle pb-2 last:border-0"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-small text-fg-primary">{i.email}</span>
                    <span className="text-micro text-fg-muted">
                      {ROLE_LABELS[i.role as Role] ?? i.role} · {i.scope} · expires {i.expiresAt}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <CopyLinkButton token={i.tokenHash} />
                    <form action={revokeAction}>
                      <input type="hidden" name="id" value={i.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Revoke
                      </Button>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Members (${members.length})`}>
          <ul className="flex flex-col gap-1.5">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 text-small">
                <span className="truncate text-fg-primary">{m.email}</span>
                <span className="flex items-center gap-2 text-micro text-fg-muted">
                  <Badge tone="neutral">{m.scope}</Badge>
                  {ROLE_LABELS[m.role as Role] ?? m.role}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        const link = `${window.location.origin}/invite?token=${token}`;
        void navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}
