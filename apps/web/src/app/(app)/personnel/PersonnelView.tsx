"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Badge, Button, Card, Drawer, EmptyState, Tabs } from "@dronops/ui";
import type { PersonDetail } from "@/server/personnel";
import {
  addApprovedAction,
  addCertAction,
  addDocAction,
  addSkillAction,
  archivePersonAction,
  createPersonAction,
} from "./actions";

type Person = { id: string; systemNumber: string | null; fullName: string; roleTitle: string | null; status: string };

const field =
  "rounded-md border border-default bg-inset px-3 py-2 text-small text-fg-primary focus-visible:border-focus";

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={field} />;
}

export function PersonnelView({ roster, detail }: { roster: Person[]; detail: PersonDetail | null }) {
  const router = useRouter();
  const open = (id: string) => router.push(`/personnel?person=${id}`);
  const close = () => router.push("/personnel");

  return (
    <div className="flex flex-col gap-4">
      <Card title="Add person">
        <form action={createPersonAction} className="flex flex-wrap items-center gap-2">
          <Input name="fullName" placeholder="Full name" required />
          <Input name="roleTitle" placeholder="Role / title" />
          <Input name="email" type="email" placeholder="Email" />
          <select name="employmentType" className={field} defaultValue="">
            <option value="">Employment type</option>
            <option value="employee">Employee</option>
            <option value="contractor">Contractor</option>
            <option value="freelance">Freelance</option>
          </select>
          <Button type="submit" size="sm">Add</Button>
        </form>
      </Card>

      <Card title={`Crew (${roster.length})`}>
        {roster.length === 0 ? (
          <EmptyState variant="first-use" title="No crew yet" description="Add your first person above." />
        ) : (
          <ul className="flex flex-col">
            {roster.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => open(p.id)}
                  className="flex w-full items-center justify-between gap-2 border-b border-subtle py-2 text-start text-small hover:text-accent last:border-0"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="font-mono text-micro text-fg-muted tabular-nums">{p.systemNumber ?? "—"}</span>
                    <span className="truncate text-fg-primary">{p.fullName}</span>
                    {p.roleTitle && <span className="truncate text-micro text-fg-muted">{p.roleTitle}</span>}
                  </span>
                  <Badge tone="neutral">{p.status}</Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {detail?.person && <PersonDrawer detail={detail} onClose={close} />}
    </div>
  );
}

function PersonDrawer({ detail, onClose }: { detail: PersonDetail; onClose: () => void }) {
  const [tab, setTab] = useState("details");
  const p = detail.person!;
  const profileLabel = new Map(detail.profiles.map((x) => [x.id, `${x.brand} ${x.model}`]));
  const skillName = new Map(detail.skillsCatalog.map((x) => [x.id, `${x.category} · ${x.name}`]));

  return (
    <Drawer open onClose={onClose} title={p.fullName}>
      <div className="mb-3 flex flex-wrap gap-3 text-micro text-fg-muted">
        <span className="font-mono tabular-nums">{p.systemNumber ?? "—"}</span>
        {p.roleTitle && <span>{p.roleTitle}</span>}
        {p.employmentType && <span>{p.employmentType}</span>}
      </div>
      <Tabs
        value={tab}
        onValueChange={setTab}
        items={[
          { value: "details", label: "Details" },
          { value: "certs", label: "Certifications" },
          { value: "skills", label: "Skills" },
          { value: "approved", label: "Approved aircraft" },
          { value: "docs", label: "Documents" },
        ]}
      />

      {tab === "details" && (
        <div className="flex flex-col gap-2 pt-3 text-small">
          <KV k="Email" v={p.email ?? "—"} />
          <KV k="Status" v={p.status} />
          <KV k="System no." v={p.systemNumber ?? "—"} />
          <form action={archivePersonAction} className="pt-2">
            <input type="hidden" name="id" value={p.id} />
            <Button type="submit" variant="ghost" size="sm">Archive person</Button>
          </form>
        </div>
      )}

      {tab === "certs" && (
        <TabBody
          empty={detail.certs.length === 0}
          emptyText="No certifications recorded."
          list={detail.certs.map((c) => (
            <Row key={c.id} primary={c.type} detail={[c.issuer, c.number].filter(Boolean).join(" · ")} right={c.expiresOn ? `expires ${c.expiresOn}` : undefined} />
          ))}
          form={
            <form action={addCertAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="personId" value={p.id} />
              <Input name="type" placeholder="Type (e.g. RPC)" required />
              <Input name="issuer" placeholder="Issuer" />
              <Input name="number" placeholder="Number" />
              <Input name="expiresOn" type="date" />
              <Button type="submit" size="sm">Add</Button>
            </form>
          }
        />
      )}

      {tab === "skills" && (
        <TabBody
          empty={detail.skillLinks.length === 0}
          emptyText="No skills recorded."
          list={detail.skillLinks.map((s) => (
            <Row key={s.id} primary={skillName.get(s.skillId) ?? "Skill"} right={s.level ?? undefined} />
          ))}
          form={
            <form action={addSkillAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="personId" value={p.id} />
              <select name="category" className={field} defaultValue="Operations">
                <option>Regulations</option>
                <option>Operations</option>
                <option>Business</option>
                <option>Tools</option>
              </select>
              <Input name="name" placeholder="Skill" required />
              <Input name="level" placeholder="Level" />
              <Button type="submit" size="sm">Add</Button>
            </form>
          }
        />
      )}

      {tab === "approved" && (
        <TabBody
          empty={detail.approved.length === 0}
          emptyText="No approved aircraft models."
          list={detail.approved.map((a) => (
            <Row key={a.id} primary={profileLabel.get(a.droneProfileId) ?? "Model"} right={a.dateApproved ?? undefined} />
          ))}
          form={
            <form action={addApprovedAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="personId" value={p.id} />
              <select name="droneProfileId" className={field} required defaultValue="">
                <option value="" disabled>Drone model…</option>
                {detail.profiles.map((pr) => (
                  <option key={pr.id} value={pr.id}>{pr.brand} {pr.model}</option>
                ))}
              </select>
              <Input name="dateApproved" type="date" />
              <Button type="submit" size="sm">Approve</Button>
            </form>
          }
        />
      )}

      {tab === "docs" && (
        <TabBody
          empty={detail.docs.length === 0}
          emptyText="No documents recorded."
          list={detail.docs.map((d) => (
            <Row key={d.id} primary={d.title} detail={d.docType ?? ""} right={d.expiresOn ? `expires ${d.expiresOn}` : undefined} />
          ))}
          form={
            <form action={addDocAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="personId" value={p.id} />
              <Input name="title" placeholder="Title" required />
              <Input name="docType" placeholder="Type" />
              <Input name="expiresOn" type="date" />
              <Button type="submit" size="sm">Add</Button>
            </form>
          }
        />
      )}
    </Drawer>
  );
}

function TabBody({ empty, emptyText, list, form }: { empty: boolean; emptyText: string; list: ReactNode; form: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 pt-3">
      <div className="rounded-md border border-subtle p-2">{form}</div>
      {empty ? <p className="text-small text-fg-muted">{emptyText}</p> : <ul className="flex flex-col">{list}</ul>}
    </div>
  );
}

function Row({ primary, detail, right }: { primary: string; detail?: string; right?: string }) {
  return (
    <li className="flex items-center justify-between gap-2 border-b border-subtle py-2 text-small last:border-0">
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-fg-primary">{primary}</span>
        {detail && <span className="truncate text-micro text-fg-muted">{detail}</span>}
      </span>
      {right && <span className="text-micro text-fg-muted">{right}</span>}
    </li>
  );
}

function KV({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-fg-muted">{k}</span>
      <span className="text-fg-primary">{v}</span>
    </div>
  );
}
