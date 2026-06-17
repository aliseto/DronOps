"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, StatusPill, Tabs, type StatusVocab } from "@dronops/ui";
import type { OperationsData } from "@/server/operations";
import {
  approveMissionAction,
  cancelMissionAction,
  completeMissionAction,
  createClientAction,
  createMissionAction,
  createProjectAction,
  submitMissionAction,
} from "./actions";

const field =
  "rounded-md border border-default bg-inset px-3 py-2 text-small text-fg-primary focus-visible:border-focus";

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={field} />;
}

// operation_status → the StatusPill lifecycle vocabulary
const LIFECYCLE: Record<string, StatusVocab["lifecycle"]> = {
  draft: "planning",
  planned: "submitted_for_approval",
  approved: "approved",
  completed: "flown",
  cancelled: "withdrawn",
};

export function OperationsView({ data }: { data: OperationsData }) {
  const [tab, setTab] = useState("missions");
  const projectName = new Map(data.projects.map((p) => [p.id, p.name]));
  const clientName = new Map(data.clients.map((c) => [c.id, c.company]));

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        value={tab}
        onValueChange={setTab}
        items={[
          { value: "missions", label: "Missions" },
          { value: "projects", label: "Projects" },
          { value: "clients", label: "Clients" },
          { value: "flightlog", label: "Flight log" },
        ]}
      />

      {tab === "missions" && (
        <>
          <Card title="Plan a mission">
            <form action={createMissionAction} className="flex flex-wrap items-center gap-2">
              <Input name="title" placeholder="Mission title" required />
              <select name="projectId" className={field} defaultValue="">
                <option value="">Project (none)</option>
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select name="operationCategory" className={field} defaultValue="Basic">
                <option value="Basic">Basic</option>
                <option value="Specific">Specific</option>
                <option value="Certified">Certified</option>
              </select>
              <Input name="plannedStart" type="datetime-local" />
              <Button type="submit" size="sm">Create</Button>
            </form>
          </Card>

          {data.missions.length === 0 ? (
            <EmptyState variant="first-use" title="No missions yet" description="Plan your first mission above." />
          ) : (
            <div className="flex flex-col gap-3">
              {data.missions.map((m) => (
                <Card key={m.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-micro text-fg-muted tabular-nums">{m.refCode ?? "—"}</span>
                      <span className="truncate font-medium text-fg-primary">{m.title}</span>
                      {m.operationCategory && <Badge tone="neutral">{m.operationCategory}</Badge>}
                    </span>
                    <StatusPill domain="lifecycle" status={LIFECYCLE[m.status] ?? "planning"} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-micro text-fg-muted">
                    {m.projectId && <span>{projectName.get(m.projectId) ?? "Project"}</span>}
                    {m.plannedStart && <span>planned {new Date(m.plannedStart).toLocaleDateString()}</span>}
                    {m.approvalReference && <span>approval {m.approvingAuthority} · {m.approvalReference}</span>}
                    {m.cancellationReason && <span className="text-status-danger-fg">cancelled — {m.cancellationReason}</span>}
                  </div>
                  <MissionActions id={m.id} status={m.status} />
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "projects" && (
        <Card title="Projects">
          <form action={createProjectAction} className="mb-3 flex flex-wrap items-center gap-2">
            <Input name="name" placeholder="Project name" required />
            <select name="clientId" className={field} defaultValue="">
              <option value="">Client (none)</option>
              {data.clients.map((c) => (
                <option key={c.id} value={c.id}>{c.company}</option>
              ))}
            </select>
            <Input name="description" placeholder="Description" />
            <Button type="submit" size="sm">Add</Button>
          </form>
          {data.projects.length === 0 ? (
            <p className="text-small text-fg-muted">No projects yet.</p>
          ) : (
            <ul className="flex flex-col">
              {data.projects.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 border-b border-subtle py-2 text-small last:border-0">
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-micro text-fg-muted tabular-nums">{p.refCode ?? "—"}</span>
                    <span className="text-fg-primary">{p.name}</span>
                  </span>
                  <span className="text-micro text-fg-muted">{p.clientId ? clientName.get(p.clientId) : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "clients" && (
        <Card title="Clients">
          <form action={createClientAction} className="mb-3 flex flex-wrap items-center gap-2">
            <Input name="company" placeholder="Company" required />
            <Input name="industry" placeholder="Industry" />
            <Button type="submit" size="sm">Add</Button>
          </form>
          {data.clients.length === 0 ? (
            <p className="text-small text-fg-muted">No clients yet.</p>
          ) : (
            <ul className="flex flex-col">
              {data.clients.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 border-b border-subtle py-2 text-small last:border-0">
                  <span className="text-fg-primary">{c.company}</span>
                  <span className="text-micro text-fg-muted">{c.industry ?? ""}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "flightlog" && (
        <Card title="Flight log">
          {data.flights.length === 0 ? (
            <EmptyState
              variant="good"
              title="No flight logs yet"
              description="Flight logs are imported from DJI logs (M4) and matched to an approved mission."
            />
          ) : (
            <ul className="flex flex-col">
              {data.flights.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2 border-b border-subtle py-2 text-small last:border-0">
                  <span className="font-mono text-micro text-fg-muted tabular-nums">{f.refCode ?? "—"}</span>
                  <span className="text-micro text-fg-muted">{f.startedAt ? new Date(f.startedAt).toLocaleString() : "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

function MissionActions({ id, status }: { id: string; status: string }) {
  const terminal = status === "completed" || status === "cancelled";
  if (terminal) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-subtle pt-3">
      {status === "draft" && (
        <form action={submitMissionAction}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="secondary" size="sm">Submit for approval</Button>
        </form>
      )}
      {status === "planned" && (
        <form action={approveMissionAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={id} />
          <select name="approvingAuthority" className={field} required defaultValue="GCAA">
            <option value="GCAA">GCAA</option>
            <option value="DCAA">DCAA</option>
            <option value="GACA">GACA</option>
            <option value="OMAN">Oman CAA</option>
          </select>
          <Input name="approvalReference" placeholder="Approval reference" required />
          <Input name="approvedAt" type="date" />
          <Button type="submit" size="sm">Record approval</Button>
        </form>
      )}
      {status === "approved" && (
        <form action={completeMissionAction}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="secondary" size="sm">Mark complete</Button>
        </form>
      )}
      <form action={cancelMissionAction} className="flex items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <Input name="reason" placeholder="Cancellation reason" />
        <Button type="submit" variant="ghost" size="sm">Cancel</Button>
      </form>
    </div>
  );
}
