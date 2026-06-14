"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Checkbox, Combobox, Input, StatusPill } from "@dronops/ui";
import type { ParamGroup } from "@dronops/content";
import { loadSuiteAction, saveParamsAction } from "./actions";

interface PreviewDoc {
  source: string;
  number: string;
  title: string;
  category: string;
  ownerRole: string;
  missing: string[];
  action: "create" | "update-draft" | "skip-approved";
}
type Params = Record<string, Record<string, unknown>>;

export function ManualSuiteWizard({
  groups,
  params,
  persons,
  preview,
}: {
  groups: ParamGroup[];
  params: Params;
  persons: { id: string; name: string }[];
  preview: { docs: PreviewDoc[]; allResolved: boolean };
}) {
  const [values, setValues] = useState<Params>(params);
  const [saved, setSaved] = useState(false);
  const [summary, setSummary] = useState<{ created: number; updated: number; skipped: number } | null>(
    null,
  );
  const [error, setError] = useState("");

  const get = (g: string, k: string) => values[g]?.[k];
  const set = (g: string, k: string, v: unknown) => {
    setValues((s) => ({ ...s, [g]: { ...(s[g] ?? {}), [k]: v } }));
    setSaved(false);
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-subtle px-6 py-4">
        <div>
          <h1 className="text-title font-semibold text-fg-primary">Load manual suite</h1>
          <p className="text-small text-fg-muted">
            Templatize the AIR- document suite for your operation. Preloaded as drafts — review and
            approve each.
          </p>
        </div>
        <Link href="/documents">
          <Button variant="secondary" size="sm">
            Back to documents
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <Card key={group.id} title={group.label}>
              <div className="flex flex-col gap-3">
                {group.fields.map((f) => {
                  const id = `${group.id}.${f.key}`;
                  if (f.type === "bool") {
                    return (
                      <Checkbox
                        key={id}
                        label={f.label}
                        checked={Boolean(get(group.id, f.key) ?? f.default)}
                        onChange={(e) => set(group.id, f.key, e.target.checked)}
                      />
                    );
                  }
                  if (f.type === "person") {
                    return (
                      <div key={id} className="flex flex-col gap-1">
                        <span className="text-small text-fg-secondary">
                          {f.label}
                          <span className="ms-1 text-micro text-fg-muted">({f.rbacRole})</span>
                        </span>
                        <Combobox
                          items={persons.map((p) => ({ value: p.id, label: p.name }))}
                          value={(get(group.id, f.key) as string) ?? ""}
                          onValueChange={(v) => set(group.id, f.key, v)}
                        />
                      </div>
                    );
                  }
                  if (f.type === "multiselect") {
                    const selected = (get(group.id, f.key) as string[] | undefined) ?? [];
                    return (
                      <div key={id} className="flex flex-col gap-1">
                        <span className="text-small text-fg-secondary">{f.label}</span>
                        <div className="flex flex-wrap gap-2">
                          {(f.options ?? []).map((o) => (
                            <Checkbox
                              key={o.value}
                              label={o.label}
                              checked={selected.includes(o.value)}
                              onChange={(e) =>
                                set(
                                  group.id,
                                  f.key,
                                  e.target.checked
                                    ? [...selected, o.value]
                                    : selected.filter((x) => x !== o.value),
                                )
                              }
                            />
                          ))}
                        </div>
                      </div>
                    );
                  }
                  if (f.type === "rows") {
                    return (
                      <label key={id} className="flex flex-col gap-1 text-small text-fg-secondary">
                        {f.label} (JSON)
                        <textarea
                          className="min-h-24 rounded-md border border-default bg-inset px-3 py-2 font-mono text-mono text-fg-primary"
                          defaultValue={JSON.stringify(get(group.id, f.key) ?? f.default ?? [], null, 2)}
                          onChange={(e) => {
                            try {
                              set(group.id, f.key, JSON.parse(e.target.value));
                            } catch {
                              /* ignore until valid */
                            }
                          }}
                        />
                      </label>
                    );
                  }
                  // text / number / money / date
                  return (
                    <label key={id} className="flex flex-col gap-1 text-small text-fg-secondary">
                      {f.label}
                      {f.help && <span className="text-micro text-fg-muted">{f.help}</span>}
                      <Input
                        type={f.type === "number" ? "number" : "text"}
                        value={(get(group.id, f.key) as string) ?? String(f.default ?? "")}
                        onChange={(e) =>
                          set(
                            group.id,
                            f.key,
                            f.type === "number" ? Number(e.target.value) : e.target.value,
                          )
                        }
                      />
                    </label>
                  );
                })}
              </div>
            </Card>
          ))}
          <div className="flex items-center gap-2">
            <Button
              onClick={async () => {
                await saveParamsAction(values);
                setSaved(true);
              }}
            >
              Save parameters
            </Button>
            {saved && <span className="text-small text-status-ok-fg">Saved — refresh preview</span>}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Preview">
            {!preview.allResolved && (
              <p className="mb-2 rounded-md bg-status-warn-bg px-3 py-2 text-small text-status-warn-fg">
                Some variables are unresolved — fill them in and save before loading.
              </p>
            )}
            <ul className="flex flex-col gap-2">
              {preview.docs.map((d) => (
                <li
                  key={d.number}
                  className="flex items-center justify-between border-b border-subtle pb-2 text-small"
                >
                  <span>
                    <span className="font-mono">{d.number}</span> {d.title}
                    {d.missing.length > 0 && (
                      <span className="ms-2 text-micro text-status-danger-fg">
                        missing: {d.missing.join(", ")}
                      </span>
                    )}
                  </span>
                  <Badge tone={d.action === "skip-approved" ? "neutral" : "accent"}>{d.action}</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Load">
            <p className="text-small text-fg-muted">
              Creates document drafts + form templates. Re-running updates drafts only; approved
              revisions are never touched.
            </p>
            <Button
              className="mt-3"
              disabled={!preview.allResolved}
              title={preview.allResolved ? undefined : "Resolve all variables first"}
              onClick={async () => {
                setError("");
                try {
                  setSummary(await loadSuiteAction());
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Load failed");
                }
              }}
            >
              Load manual suite
            </Button>
            {summary && (
              <p className="mt-2 text-small text-status-ok-fg">
                Created {summary.created} · updated {summary.updated} · skipped {summary.skipped}{" "}
                (approved). Review &amp; approve each in{" "}
                <Link href="/documents" className="text-accent">
                  Documents
                </Link>
                .
              </p>
            )}
            {error && (
              <p className="mt-2 text-small text-status-danger-fg">{error}</p>
            )}
            {summary && <StatusPill domain="coverage" status="covered" className="mt-2" />}
          </Card>
        </div>
      </div>
    </>
  );
}
