"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Combobox,
  DataTable,
  DateField,
  Drawer,
  EmptyState,
  FormField,
  IconButton,
  Input,
  Modal,
  Radio,
  Select,
  Skeleton,
  StatusPill,
  Switch,
  Tabs,
  Textarea,
  ThemeToggle,
  Timeline,
  Tooltip,
  ToastProvider,
  useToast,
  type Column,
} from "@dronops/ui";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-heading font-semibold text-fg-primary">{title}</h2>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
  );
}

interface DemoRow {
  id: string;
  ref: string;
  name: string;
  count: number;
}

function ToastDemo() {
  const { toast } = useToast();
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => toast({ tone: "success", message: "NCR-2026-019 created" })}>
        Success toast
      </Button>
      <Button
        size="sm"
        variant="danger"
        onClick={() => toast({ tone: "error", message: "Upload failed — retry" })}
      >
        Error toast
      </Button>
    </div>
  );
}

function Showcase() {
  const [tab, setTab] = useState("a");
  const [drawer, setDrawer] = useState(false);
  const [modal, setModal] = useState(false);
  const [combo, setCombo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const rows = useMemo<DemoRow[]>(
    () =>
      Array.from({ length: 5000 }, (_, i) => ({
        id: String(i),
        ref: `FLT-${String(i).padStart(4, "0")}`,
        name: `Mission ${i}`,
        count: (i * 7) % 100,
      })),
    [],
  );
  const columns: Column<DemoRow>[] = [
    { key: "ref", header: "Ref", accessor: (r) => r.ref, sortable: true, width: "160px" },
    { key: "name", header: "Name", accessor: (r) => r.name, sortable: true },
    { key: "count", header: "Count", accessor: (r) => r.count, sortable: true, width: "120px" },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-title font-semibold text-fg-primary">UI review surface</h1>
          <p className="text-small text-fg-muted">Every primitive, both themes. /dev/ui</p>
        </div>
        <ThemeToggle className="rounded-md border border-default bg-surface px-3 py-1.5 text-small text-fg-secondary hover:bg-hover" />
      </header>

      <Section title="Buttons">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button disabled>Disabled</Button>
        <IconButton label="Settings">⚙</IconButton>
      </Section>

      <Section title="Status & badges">
        <StatusPill domain="mission" status="sealed" />
        <StatusPill domain="currency" status="expiring" detail="12 d" />
        <StatusPill domain="ncr" status="open" />
        <StatusPill domain="asset" status="grounded" />
        <StatusPill domain="coverage" status="partial" />
        <Badge tone="accent">accent</Badge>
        <Badge tone="external">external</Badge>
      </Section>

      <Section title="Inputs">
        <Input placeholder="Text" />
        <Input mono placeholder="MONO-001" />
        <Textarea placeholder="Notes" />
        <FormField label="Email" required help="We never share it." error="Enter a valid email">
          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} type="email" />}
        </FormField>
        <Select
          options={[
            { value: "a", label: "Alpha" },
            { value: "b", label: "Bravo" },
          ]}
          placeholder="Choose…"
        />
        <DateField tzLabel="Asia/Dubai" />
      </Section>

      <Section title="Controls">
        <Checkbox label="Checkbox" defaultChecked />
        <Radio name="r" label="Radio" defaultChecked />
        <Switch label="Switch" defaultChecked />
        <div className="w-64">
          <Combobox
            items={[
              { value: "1", label: "DJI M30T", detail: "SN-001" },
              { value: "2", label: "DJI M3E", detail: "SN-002" },
            ]}
            value={combo}
            onValueChange={setCombo}
          />
        </div>
      </Section>

      <Section title="Tabs / Tooltip / Skeleton">
        <div className="w-full">
          <Tabs
            items={[
              { value: "a", label: "Overview" },
              { value: "b", label: "History" },
            ]}
            value={tab}
            onValueChange={setTab}
          />
        </div>
        <Tooltip content="UAC.035 — 3 hour clock">
          <span className="text-small text-accent underline">§UAC.035</span>
        </Tooltip>
        <Skeleton className="h-8 w-40" />
      </Section>

      <Section title="Empty states">
        <EmptyState variant="first-use" title="No documents yet" description="Create your first." />
        <EmptyState variant="filtered" title="No results" description="Try fewer filters." />
        <EmptyState variant="good" title="Nothing needs your attention" />
      </Section>

      <Section title="Overlays & feedback">
        <Button onClick={() => setDrawer(true)}>Open drawer</Button>
        <Button onClick={() => setModal(true)}>Open modal</Button>
        <ToastDemo />
      </Section>

      <Section title="DataTable (5k rows, virtualized)">
        <div className="w-full">
          <DataTable
            columns={columns}
            rows={rows}
            getRowId={(r) => r.id}
            selectable
            selected={selected}
            onSelectedChange={setSelected}
            csvFileName="demo"
          />
        </div>
      </Section>

      <Section title="Timeline (audit trail)">
        <div className="w-full max-w-md">
          <Timeline
            events={[
              { id: "1", action: "organization.create", actor: "ali@…", at: "2026-06-07 09:14Z" },
              {
                id: "2",
                action: "org_jurisdiction.enable",
                actor: "ali@…",
                at: "2026-06-07 09:15Z",
                summary: "KSA",
              },
              { id: "3", action: "membership.invite", actor: "ali@…", at: "2026-06-07 09:16Z" },
            ]}
          />
        </div>
      </Section>

      <Card title="Card">
        <p className="text-small text-fg-muted">Card body content.</p>
      </Card>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Drawer title">
        <p className="text-small text-fg-secondary">End-side detail surface.</p>
      </Drawer>
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Obsolete revision 2?"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={() => setModal(false)}>
              Obsolete revision 2
            </Button>
          </>
        }
      >
        <p className="text-small text-fg-secondary">This makes revision 2 non-current.</p>
      </Modal>
    </div>
  );
}

export default function DevUiPage() {
  return (
    <ToastProvider>
      <Showcase />
    </ToastProvider>
  );
}
