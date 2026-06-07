"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Combobox,
  DataTable,
  Drawer,
  Input,
  Modal,
  Select,
  SignatureCeremony,
  StatusPill,
  Tabs,
  Timeline,
  type Column,
  type StatusVocab,
  type TimelineEvent,
} from "@dronops/ui";
import {
  CATEGORY_LABEL,
  DOCUMENT_CATEGORIES,
  DOMAIN_ROLES,
  DOMAIN_ROLE_LABELS,
  type DocumentCategory,
  type DocumentStatusResult,
  type RevisionStatus,
} from "@dronops/shared";
import {
  acknowledgeAction,
  approveRevisionAction,
  createDocumentAction,
  distributeAction,
  newRevisionAction,
  replaceExternalAction,
  submitForReviewAction,
} from "./actions";

interface DistItem {
  id: string;
  audienceType: "role" | "person";
  audienceLabel: string;
  ackRequired: boolean;
  dueAt: string | null;
  total: number;
  acked: number;
  overdue: boolean;
  mine: boolean;
  ackedByMe: boolean;
}
interface Person {
  id: string;
  name: string;
}

type DocStatus = StatusVocab["document"];
const REV_TO_PILL: Record<RevisionStatus, DocStatus> = {
  draft: "draft",
  in_review: "in-review",
  approved: "effective",
  obsolete: "obsolete",
};

interface ListItem {
  id: string;
  docNo: string;
  category: string;
  title: string;
  reviewDueAt: string | null;
  updatedAt: string;
  status: DocumentStatusResult;
}
interface Revision {
  id: string;
  revNo: number;
  status: RevisionStatus;
  changeSummary: string | null;
  effectiveAt: string | null;
  bodyFileId: string | null;
}
interface Detail {
  document: { id: string; docNo: string; title: string; category: string };
  revisions: Revision[];
  requirements: string[];
}
interface Exceptions {
  inReview: number | null; // null = not QM/AM
  reviewDue: number;
}

function StatusCell({ item }: { item: ListItem }) {
  const p = item.status.primary;
  if (p.kind === "external") {
    const detail =
      p.status === "review-due" && p.days != null
        ? `${p.days} d`
        : p.status === "expired" && p.days != null
          ? `${Math.abs(p.days)} d`
          : undefined;
    return <StatusPill domain="external" status={p.status} detail={detail} />;
  }
  return (
    <span className="flex items-center gap-1">
      <StatusPill domain="document" status={REV_TO_PILL[p.status]} />
      {item.status.inFlight && (
        <Badge tone="accent">
          rev {item.status.inFlight.revNo}{" "}
          {item.status.inFlight.status === "in_review" ? "in review" : "draft"}
        </Badge>
      )}
    </span>
  );
}

export function DocumentsView({
  docs,
  detail,
  canApprove,
  exceptions,
  history,
  currentRevisionId,
  persons,
  distributions,
}: {
  docs: ListItem[];
  detail: Detail | null;
  canApprove: boolean;
  exceptions: Exceptions;
  history: TimelineEvent[];
  currentRevisionId: string | null;
  persons: Person[];
  distributions: DistItem[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [category, setCategory] = useState<DocumentCategory | "all">("all");
  const [newOpen, setNewOpen] = useState(false);
  const [signFor, setSignFor] = useState<Revision | null>(null);

  const filtered = useMemo(
    () => (category === "all" ? docs : docs.filter((d) => d.category === category)),
    [docs, category],
  );

  const columns: Column<ListItem>[] = [
    {
      key: "docNo",
      header: "Doc no",
      accessor: (r) => r.docNo,
      sortable: true,
      width: "130px",
      cell: (r) => <span className="font-mono">{r.docNo}</span>,
    },
    { key: "title", header: "Title", accessor: (r) => r.title, sortable: true },
    {
      key: "category",
      header: "Category",
      accessor: (r) => r.category,
      sortable: true,
      width: "130px",
      cell: (r) => CATEGORY_LABEL[r.category as DocumentCategory] ?? r.category,
    },
    { key: "status", header: "Status", width: "200px", accessor: (r) => r.status.primary.status, cell: (r) => <StatusCell item={r} /> },
    {
      key: "updated",
      header: "Updated",
      width: "120px",
      accessor: (r) => r.updatedAt,
      cell: (r) => new Date(r.updatedAt).toLocaleDateString(),
    },
  ];

  const open = (id: string) => router.push(`${pathname}?panel=doc:${id}`);
  const close = () => router.push(pathname);

  // role-aware exceptions line (personal obligations, not org totals)
  const needsYou: string[] = [];
  if (exceptions.inReview && exceptions.inReview > 0) needsYou.push(`${exceptions.inReview} in review`);
  if (exceptions.reviewDue > 0) needsYou.push(`${exceptions.reviewDue} review-due`);

  return (
    <>
      <div className="flex items-center justify-between border-b border-subtle px-6 py-4">
        <div>
          <h1 className="text-title font-semibold text-fg-primary">Documents</h1>
          {needsYou.length > 0 ? (
            <p className="text-small text-status-warn-fg">Needs you: {needsYou.join(" · ")}</p>
          ) : (
            <p className="text-small text-fg-muted">
              Controlled documents, manuals, forms and external records.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/documents/manual-suite">
            <Button variant="secondary">Load manual suite</Button>
          </Link>
          <Link href="/documents/forms">
            <Button variant="secondary">Form templates</Button>
          </Link>
          <Button onClick={() => setNewOpen(true)}>New document</Button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-3 flex flex-wrap gap-1">
          {(["all", ...DOCUMENT_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={
                "rounded-pill px-3 py-1 text-small " +
                (category === c ? "bg-selected text-fg-primary" : "text-fg-muted hover:bg-hover")
              }
            >
              {c === "all" ? "All" : CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(r) => r.id}
          onRowClick={(r) => open(r.id)}
          csvFileName="documents"
          empty={<p className="text-small text-fg-muted">No documents yet. Create your first.</p>}
        />
      </div>

      <NewDocumentModal open={newOpen} onClose={() => setNewOpen(false)} />

      {detail && (
        <RevisionDrawer
          detail={detail}
          canApprove={canApprove}
          history={history}
          currentRevisionId={currentRevisionId}
          persons={persons}
          distributions={distributions}
          onClose={close}
          onApprove={(rev) => setSignFor(rev)}
        />
      )}

      {signFor && detail && (
        <SignatureCeremony
          open
          onClose={() => setSignFor(null)}
          meaning={`I approve revision ${signFor.revNo} of ${detail.document.docNo} "${detail.document.title}" as effective. This obsoletes the previous approved revision.`}
          onSign={(proof) =>
            approveRevisionAction(
              signFor.id,
              `I approve revision ${signFor.revNo} of ${detail.document.docNo} as effective.`,
              proof,
            )
          }
        />
      )}
    </>
  );
}

function NewDocumentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [category, setCategory] = useState<DocumentCategory>("manual");
  return (
    <Modal open={open} onClose={onClose} title="New document">
      <form action={createDocumentAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-small text-fg-secondary">
          Category
          <Select
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            options={DOCUMENT_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-small text-fg-secondary">
          Title
          <Input name="title" required />
        </label>
        <label className="flex flex-col gap-1 text-small text-fg-secondary">
          Custom number (optional — carries legacy numbers like AIR-MAN-001)
          <Input name="customNumber" mono />
        </label>
        {category === "external" && (
          <label className="flex flex-col gap-1 text-small text-fg-secondary">
            Review due
            <Input name="reviewDueAt" type="date" />
          </label>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Create document
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RevisionDrawer({
  detail,
  canApprove,
  history,
  currentRevisionId,
  persons,
  distributions,
  onClose,
  onApprove,
}: {
  detail: Detail;
  canApprove: boolean;
  history: TimelineEvent[];
  currentRevisionId: string | null;
  persons: Person[];
  distributions: DistItem[];
  onClose: () => void;
  onApprove: (rev: Revision) => void;
}) {
  const { document: doc, revisions, requirements } = detail;
  const external = doc.category === "external";
  const [tab, setTab] = useState("overview");
  const [audienceType, setAudienceType] = useState<"role" | "person">("role");
  const [personRef, setPersonRef] = useState("");

  const current = [...revisions].reverse().find((r) => r.status === "approved");
  const inReview = revisions.find((r) => r.status === "in_review");
  const draft = revisions.find((r) => r.status === "draft");
  const headPill: DocStatus = current ? "effective" : inReview ? "in-review" : "draft";

  return (
    <Drawer
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <span className="font-mono">{doc.docNo}</span> · {doc.title}
          {!external && <StatusPill domain="document" status={headPill} />}
        </span>
      }
    >
      <Tabs
        className="mb-4"
        value={tab}
        onValueChange={setTab}
        items={[
          { value: "overview", label: "Overview" },
          { value: "revisions", label: "Revisions" },
          { value: "requirements", label: "Requirements" },
          ...(external ? [] : [{ value: "distribution", label: "Distribution" }]),
          { value: "history", label: "History" },
        ]}
      />

      {tab === "overview" && (
        <div className="flex flex-col gap-4">
          {external ? (
            <Card title="External document">
              <p className="text-small text-fg-muted">
                External records skip the approval workflow and track a review date.
              </p>
              <form
                action={replaceExternalAction.bind(null, doc.id)}
                className="mt-3 flex flex-col gap-2"
              >
                <input
                  type="file"
                  name="file"
                  required
                  className="text-small text-fg-secondary file:me-2 file:rounded-md file:border file:border-default file:bg-surface file:px-3 file:py-1"
                />
                <label className="flex flex-col gap-1 text-small text-fg-secondary">
                  New review due
                  <Input name="reviewDueAt" type="date" />
                </label>
                <Button size="sm" type="submit" className="self-start">
                  Replace document
                </Button>
              </form>
            </Card>
          ) : (
            <>
              {inReview && (
                <Card title={`Revision ${inReview.revNo} · in review`}>
                  <p className="text-small text-fg-muted">
                    {inReview.changeSummary ?? "No change summary."}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      disabled={!canApprove}
                      title={canApprove ? undefined : "Requires quality manager or accountable manager"}
                      onClick={() => onApprove(inReview)}
                    >
                      Approve…
                    </Button>
                    {!canApprove && (
                      <span className="text-micro text-fg-muted">
                        Requires quality manager or accountable manager
                      </span>
                    )}
                  </div>
                </Card>
              )}
              {draft && (
                <Card title={`Revision ${draft.revNo} · draft`}>
                  <p className="text-small text-fg-muted">
                    {draft.changeSummary ?? "No change summary."}
                  </p>
                  <form action={submitForReviewAction.bind(null, draft.id)} className="mt-3">
                    <Button size="sm" type="submit">
                      Submit for review
                    </Button>
                  </form>
                </Card>
              )}
              {current && (
                <Card title={`Current — revision ${current.revNo}`}>
                  <p className="text-micro text-fg-muted">
                    🔒 Approved · effective{" "}
                    {current.effectiveAt ? new Date(current.effectiveAt).toISOString() : ""} UTC
                  </p>
                  <p className="mt-1 text-small text-fg-secondary">{current.changeSummary ?? ""}</p>
                  <p className="mt-2 text-micro text-fg-muted">
                    Approved records are immutable — create a new revision to amend.
                  </p>
                  <form action={newRevisionAction.bind(null, doc.id)} className="mt-3">
                    <Button size="sm" variant="secondary" type="submit">
                      New revision
                    </Button>
                  </form>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {tab === "revisions" && (
        <Card title={external ? "Versions" : "Revision history"}>
          <ul className="flex flex-col gap-2">
            {[...revisions].reverse().map((r) => (
              <li key={r.id} className="flex flex-col gap-0.5 border-b border-subtle pb-2 text-small">
                <span className="flex items-center justify-between">
                  <span
                    className={r.status === "obsolete" ? "text-fg-muted line-through" : "text-fg-primary"}
                  >
                    {external ? "Version" : "Rev"} {r.revNo}
                  </span>
                  {!external && <StatusPill domain="document" status={REV_TO_PILL[r.status]} />}
                </span>
                {r.status === "obsolete" && (
                  <span className="rounded bg-inset px-2 py-0.5 text-micro text-fg-muted">
                    OBSOLETE — superseded. Read-only, download still permitted (audit-logged).
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === "requirements" && (
        <Card title="Linked requirements">
          {requirements.length === 0 ? (
            <p className="text-small text-fg-muted">No linked requirements.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {requirements.map((r) => (
                <span
                  key={r}
                  className="rounded-pill bg-inset px-2 py-0.5 font-mono text-micro text-fg-secondary"
                >
                  {r}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "distribution" && (
        <div className="flex flex-col gap-4">
          {currentRevisionId ? (
            <Card title="Distribute current revision">
              <form
                action={distributeAction.bind(null, currentRevisionId)}
                className="flex flex-col gap-3"
              >
                <label className="flex flex-col gap-1 text-small text-fg-secondary">
                  Audience
                  <Select
                    name="audienceType"
                    value={audienceType}
                    onChange={(e) => setAudienceType(e.target.value as "role" | "person")}
                    options={[
                      { value: "role", label: "By role" },
                      { value: "person", label: "By person" },
                    ]}
                  />
                </label>
                {audienceType === "role" ? (
                  <label className="flex flex-col gap-1 text-small text-fg-secondary">
                    Role
                    <Select
                      name="audienceRef"
                      options={DOMAIN_ROLES.map((r) => ({ value: r, label: DOMAIN_ROLE_LABELS[r] }))}
                    />
                  </label>
                ) : (
                  <>
                    <input type="hidden" name="audienceRef" value={personRef} />
                    <span className="text-small text-fg-secondary">Person</span>
                    <Combobox
                      items={persons.map((p) => ({ value: p.id, label: p.name }))}
                      value={personRef}
                      onValueChange={setPersonRef}
                    />
                  </>
                )}
                <Checkbox name="ackRequired" label="Acknowledgement required" defaultChecked />
                <label className="flex flex-col gap-1 text-small text-fg-secondary">
                  Due date
                  <Input name="dueAt" type="date" />
                </label>
                <Button size="sm" type="submit" className="self-start">
                  Distribute
                </Button>
              </form>
            </Card>
          ) : (
            <p className="text-small text-fg-muted">Approve a revision before distributing.</p>
          )}

          <Card title="Distributions">
            {distributions.length === 0 ? (
              <p className="text-small text-fg-muted">Not distributed yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {distributions.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between border-b border-subtle pb-2 text-small"
                  >
                    <span className="text-fg-primary">
                      {d.audienceLabel}
                      <span className="ms-2 text-micro text-fg-muted">
                        {d.ackRequired ? `${d.acked}/${d.total} acked` : "no ack required"}
                        {d.dueAt ? ` · due ${new Date(d.dueAt).toLocaleDateString()}` : ""}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      {d.overdue && <StatusPill domain="currency" status="lapsed" detail="overdue" />}
                      {d.mine && d.ackRequired && !d.ackedByMe && (
                        <form action={acknowledgeAction.bind(null, d.id)}>
                          <Button size="sm" type="submit">
                            Acknowledge
                          </Button>
                        </form>
                      )}
                      {d.mine && d.ackedByMe && (
                        <StatusPill domain="currency" status="current" detail="acked" />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === "history" && (
        <Card title="Audit history">
          <Timeline events={history} />
        </Card>
      )}
    </Drawer>
  );
}
