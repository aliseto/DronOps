import type { ReactNode } from "react";
import { Button, Card, Input, PageHeader, StatusPill } from "@dronops/ui";
import { JURISDICTIONS, JURISDICTION_KEYS, jurisdictionAdvisories } from "@dronops/content";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { listEnabledJurisdictions, listMembers, listUserOrganizations } from "@/server/org";
import { createOrgAction, inviteMemberAction, toggleJurisdictionAction } from "./actions";

function Step({
  index,
  title,
  done,
  children,
}: {
  index: number;
  title: string;
  done: boolean;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-inset font-mono text-micro text-fg-secondary">
          {index}
        </span>
        <h2 className="text-heading font-semibold text-fg-primary">{title}</h2>
        {done && <StatusPill domain="coverage" status="covered" className="ms-auto" />}
      </div>
      {children}
    </Card>
  );
}

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  const userId = user?.id ?? "";
  const orgs = userId ? await listUserOrganizations(userId) : [];
  const hasOrg = orgs.length > 0;
  const orgId = userId ? await getActiveOrgId(userId) : null;
  const enabled = orgId ? await listEnabledJurisdictions(orgId) : [];
  const members = orgId ? await listMembers(orgId) : [];
  const invites = members.filter((m) => m.status === "invited");
  const advisories = jurisdictionAdvisories(enabled);

  return (
    <>
      <PageHeader
        title="Set up your organization"
        description="A checklist, not a wizard — each step is optional and you can return any time."
      />
      <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
        <Step index={1} title="Create organization" done={hasOrg}>
          {hasOrg ? (
            <p className="text-small text-fg-muted">
              Active organization: <span className="font-medium text-fg-primary">{orgs[0]?.name}</span>
            </p>
          ) : (
            <form action={createOrgAction} className="flex items-end gap-2">
              <label className="flex flex-1 flex-col gap-1 text-small text-fg-secondary">
                Organization name
                <Input name="name" required placeholder="Aironov Operations" />
              </label>
              <Button type="submit">Create</Button>
            </form>
          )}
        </Step>

        <Step index={2} title="Enable jurisdictions" done={enabled.length > 0}>
          <p className="mb-3 text-small text-fg-muted">
            Org settings enable frameworks; each mission, occurrence and registration later binds
            one. This is normal to leave partial for a new organization.
          </p>
          <div className="flex flex-col gap-2">
            {JURISDICTION_KEYS.map((key) => {
              const j = JURISDICTIONS[key];
              const isOn = enabled.includes(key);
              return (
                <form
                  key={key}
                  action={toggleJurisdictionAction}
                  className="flex items-center gap-3 rounded-md border border-subtle bg-inset px-3 py-2"
                >
                  <input type="hidden" name="key" value={key} />
                  <input type="hidden" name="enabled" value={String(isOn)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-small font-medium text-fg-primary">{j.label}</span>
                      <span className="font-mono text-micro text-fg-muted">{j.authority}</span>
                    </div>
                    <p className="truncate text-micro text-fg-muted">{j.summary}</p>
                  </div>
                  <Button type="submit" variant={isOn ? "secondary" : "primary"} size="sm" disabled={!hasOrg}>
                    {isOn ? "Disable" : "Enable"}
                  </Button>
                </form>
              );
            })}
          </div>
          {advisories.map((a, i) => (
            <p
              key={i}
              role="note"
              className="mt-3 rounded-md bg-status-warn-bg px-3 py-2 text-small text-status-warn-fg"
            >
              {a.message}
            </p>
          ))}
        </Step>

        <Step index={3} title="Invite members" done={invites.length > 0}>
          <form action={inviteMemberAction} className="flex items-end gap-2">
            <label className="flex flex-1 flex-col gap-1 text-small text-fg-secondary">
              Email
              <Input name="email" type="email" required placeholder="colleague@aironov.com" />
            </label>
            <label className="flex flex-col gap-1 text-small text-fg-secondary">
              Role
              <select
                name="role"
                className="rounded-md border border-default bg-inset px-3 py-2 text-body text-fg-primary"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <Button type="submit" disabled={!hasOrg}>
              Invite
            </Button>
          </form>
          {members.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1">
              {members.map((m) => (
                <li
                  key={m.email}
                  className="flex items-center justify-between rounded-md border border-subtle bg-inset px-3 py-2 text-small"
                >
                  <span>{m.email}</span>
                  <span className="flex items-center gap-2 text-fg-muted">
                    <span className="font-mono text-micro">{m.role}</span>
                    {m.status === "invited" ? (
                      <StatusPill domain="currency" status="unverified" detail="invited" />
                    ) : (
                      <StatusPill domain="currency" status="current" detail="active" />
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Step>
      </div>
    </>
  );
}
