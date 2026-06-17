"use client";

import { useState, type ReactNode } from "react";
import { Badge, Button, Card, EmptyState, Tabs } from "@dronops/ui";
import type { FleetData } from "@/server/fleet";
import {
  addAircraftAction,
  addBatteryAction,
  addBatteryProfileAction,
  addControllerAction,
  addControllerProfileAction,
  addDroneProfileAction,
  addEquipmentAction,
  addEquipmentProfileAction,
  archiveAssetAction,
} from "./actions";

const field =
  "rounded-md border border-default bg-inset px-3 py-2 text-small text-fg-primary focus-visible:border-focus";

type ProfileOpt = { id: string; label: string };

export function FleetView({ data }: { data: FleetData }) {
  const [tab, setTab] = useState("aircraft");

  const droneOpts: ProfileOpt[] = data.droneProfiles.map((p) => ({ id: p.id, label: `${p.brand} ${p.model}` }));
  const batteryOpts: ProfileOpt[] = data.batteryProfiles.map((p) => ({ id: p.id, label: [p.brand, p.model].filter(Boolean).join(" ") || "Battery" }));
  const controllerOpts: ProfileOpt[] = data.controllerProfiles.map((p) => ({ id: p.id, label: [p.brand, p.model].filter(Boolean).join(" ") || "Controller" }));
  const equipmentOpts: ProfileOpt[] = data.equipmentProfiles.map((p) => ({ id: p.id, label: [p.brand, p.model].filter(Boolean).join(" ") || "Equipment" }));

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        value={tab}
        onValueChange={setTab}
        items={[
          { value: "aircraft", label: "Aircraft" },
          { value: "batteries", label: "Batteries" },
          { value: "controllers", label: "Controllers" },
          { value: "equipment", label: "Equipment" },
          { value: "profiles", label: "Profiles" },
        ]}
      />

      {tab === "aircraft" && (
        <Section
          title="Aircraft"
          rows={data.aircraft.map((a) => ({
            id: a.id,
            sys: a.systemNumber,
            primary: a.name,
            detail: [a.serial, a.registration].filter(Boolean).join(" · "),
            status: a.status,
          }))}
          archiveKind="aircraft"
          form={
            <ProfileForm action={addAircraftAction} profiles={droneOpts} profileLabel="Drone profile">
              <Input name="name" placeholder="Name" required />
              <Input name="serial" placeholder="Serial" />
              <Input name="registration" placeholder="Registration" />
            </ProfileForm>
          }
        />
      )}

      {tab === "batteries" && (
        <Section
          title="Batteries"
          rows={data.batteries.map((b) => ({ id: b.id, sys: b.systemNumber, primary: b.serial ?? "—", detail: "", status: b.status }))}
          archiveKind="battery"
          form={
            <ProfileForm action={addBatteryAction} profiles={batteryOpts} profileLabel="Battery profile">
              <Input name="serial" placeholder="Serial" />
            </ProfileForm>
          }
        />
      )}

      {tab === "controllers" && (
        <Section
          title="Controllers"
          rows={data.controllers.map((c) => ({ id: c.id, sys: c.systemNumber, primary: c.rcSerial ?? "—", detail: "", status: c.status }))}
          archiveKind="controller"
          form={
            <ProfileForm action={addControllerAction} profiles={controllerOpts} profileLabel="Controller profile">
              <Input name="rcSerial" placeholder="RC serial" />
            </ProfileForm>
          }
        />
      )}

      {tab === "equipment" && (
        <Section
          title="Equipment"
          rows={data.equipment.map((e) => ({ id: e.id, sys: e.systemNumber, primary: e.name, detail: e.serial ?? "", status: e.status }))}
          archiveKind="equipment"
          form={
            <ProfileForm action={addEquipmentAction} profiles={equipmentOpts} profileLabel="Equipment profile">
              <Input name="name" placeholder="Name" required />
              <Input name="serial" placeholder="Serial" />
            </ProfileForm>
          }
        />
      )}

      {tab === "profiles" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Drone profiles">
            <form action={addDroneProfileAction} className="mb-3 flex flex-wrap gap-2">
              <Input name="brand" placeholder="Brand" required />
              <Input name="model" placeholder="Model" required />
              <Input name="airframeType" placeholder="Airframe type" />
              <Button type="submit" size="sm">Add</Button>
            </form>
            <ProfileList rows={data.droneProfiles.map((p) => `${p.brand} ${p.model}`)} />
          </Card>
          <Card title="Battery profiles">
            <form action={addBatteryProfileAction} className="mb-3 flex flex-wrap gap-2">
              <Input name="brand" placeholder="Brand" />
              <Input name="model" placeholder="Model" />
              <Input name="batteryType" placeholder="Type" />
              <Button type="submit" size="sm">Add</Button>
            </form>
            <ProfileList rows={data.batteryProfiles.map((p) => [p.brand, p.model].filter(Boolean).join(" ") || "—")} />
          </Card>
          <Card title="Controller profiles">
            <form action={addControllerProfileAction} className="mb-3 flex flex-wrap gap-2">
              <Input name="brand" placeholder="Brand" />
              <Input name="model" placeholder="Model" />
              <Input name="type" placeholder="Type" />
              <Button type="submit" size="sm">Add</Button>
            </form>
            <ProfileList rows={data.controllerProfiles.map((p) => [p.brand, p.model].filter(Boolean).join(" ") || "—")} />
          </Card>
          <Card title="Equipment profiles">
            <form action={addEquipmentProfileAction} className="mb-3 flex flex-wrap gap-2">
              <Input name="brand" placeholder="Brand" />
              <Input name="model" placeholder="Model" />
              <Input name="category" placeholder="Category" />
              <Button type="submit" size="sm">Add</Button>
            </form>
            <ProfileList rows={data.equipmentProfiles.map((p) => [p.brand, p.model].filter(Boolean).join(" ") || "—")} />
          </Card>
        </div>
      )}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={field} />;
}

function ProfileForm({
  action,
  profiles,
  profileLabel,
  children,
}: {
  action: (fd: FormData) => void | Promise<void>;
  profiles: ProfileOpt[];
  profileLabel: string;
  children: ReactNode;
}) {
  return (
    <form action={action} className="mb-3 flex flex-wrap items-center gap-2">
      <select name="profileId" className={field} defaultValue="">
        <option value="">{profileLabel} (none)</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      {children}
      <Button type="submit" size="sm">Add</Button>
    </form>
  );
}

interface Row {
  id: string;
  sys: string | null;
  primary: string;
  detail: string;
  status: string;
}

function Section({
  title,
  rows,
  archiveKind,
  form,
}: {
  title: string;
  rows: Row[];
  archiveKind: string;
  form: ReactNode;
}) {
  return (
    <Card title={title}>
      {form}
      {rows.length === 0 ? (
        <EmptyState variant="first-use" title={`No ${title.toLowerCase()} yet`} description="Add one above." />
      ) : (
        <ul className="flex flex-col">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 border-b border-subtle py-2 text-small last:border-0">
              <span className="flex min-w-0 items-center gap-2">
                <span className="font-mono text-micro text-fg-muted tabular-nums">{r.sys ?? "—"}</span>
                <span className="truncate text-fg-primary">{r.primary}</span>
                {r.detail && <span className="truncate text-micro text-fg-muted">{r.detail}</span>}
              </span>
              <span className="flex items-center gap-2">
                <Badge tone="neutral">{r.status}</Badge>
                <form action={archiveAssetAction}>
                  <input type="hidden" name="kind" value={archiveKind} />
                  <input type="hidden" name="id" value={r.id} />
                  <Button type="submit" variant="ghost" size="sm">Archive</Button>
                </form>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ProfileList({ rows }: { rows: string[] }) {
  if (rows.length === 0) return <p className="text-small text-fg-muted">None yet.</p>;
  return (
    <ul className="flex flex-col gap-1 text-small text-fg-secondary">
      {rows.map((r, i) => (
        <li key={i} className="border-b border-subtle py-1 last:border-0">{r}</li>
      ))}
    </ul>
  );
}
