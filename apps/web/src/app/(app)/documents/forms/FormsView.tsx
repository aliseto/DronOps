"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  FormRenderer,
  Input,
  Select,
  StatusPill,
} from "@dronops/ui";
import {
  APPLIES_TO,
  FIELD_TYPES,
  FIELD_TYPE_LABEL,
  newId,
  type FieldDef,
  type FieldType,
  type FormSchema,
  type SectionDef,
  type TemplateStatus,
} from "@dronops/shared";
import {
  createTemplateAction,
  newVersionAction,
  publishTemplateAction,
  saveSchemaAction,
} from "./actions";

interface TemplateItem {
  id: string;
  code: string;
  version: number;
  title: string;
  appliesTo: string;
  status: TemplateStatus;
}
interface Editing {
  id: string;
  code: string;
  version: number;
  title: string;
  schema: FormSchema;
}

const statusTone: Record<TemplateStatus, "accent" | "neutral"> = {
  draft: "accent",
  active: "neutral",
  retired: "neutral",
};

export function FormsView({
  templates,
  editing,
}: {
  templates: TemplateItem[];
  editing: Editing | null;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-subtle px-6 py-4">
        <div>
          <h1 className="text-title font-semibold text-fg-primary">Form templates</h1>
          <p className="text-small text-fg-muted">
            Versioned templates. Editing an active version creates the next version; instances pin
            the version they were captured against.
          </p>
        </div>
        <Link href="/documents">
          <Button variant="secondary" size="sm">
            Back to documents
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-4">
          <Card title="Templates">
            {templates.length === 0 ? (
              <p className="text-small text-fg-muted">No templates yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {templates.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 text-small">
                    <span className="min-w-0">
                      <span className="font-mono">{t.code}</span> v{t.version}
                      <span className="ms-1 truncate text-fg-muted">{t.title}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge tone={statusTone[t.status]}>{t.status}</Badge>
                      {t.status === "draft" && (
                        <Link href={`/documents/forms?edit=${t.id}`} className="text-accent">
                          Edit
                        </Link>
                      )}
                      {t.status === "active" && (
                        <form action={newVersionAction.bind(null, t.code)}>
                          <button type="submit" className="text-accent">
                            New version
                          </button>
                        </form>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="New template">
            <form action={createTemplateAction} className="flex flex-col gap-2">
              <Input name="code" placeholder="Code (e.g. PREFLIGHT-01)" mono required />
              <Input name="title" placeholder="Title" required />
              <Select
                name="appliesTo"
                options={APPLIES_TO.map((a) => ({ value: a, label: a }))}
              />
              <Button size="sm" type="submit" className="self-start">
                Create draft
              </Button>
            </form>
          </Card>
        </div>

        {editing ? (
          <TemplateBuilder editing={editing} />
        ) : (
          <Card title="Builder">
            <p className="text-small text-fg-muted">
              Select a draft to edit, or create a new template.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}

function TemplateBuilder({ editing }: { editing: Editing }) {
  const [title, setTitle] = useState(editing.title);
  const [schema, setSchema] = useState<FormSchema>(editing.schema);
  const [saved, setSaved] = useState(false);

  const update = (next: FormSchema) => {
    setSchema(next);
    setSaved(false);
  };

  const addSection = () =>
    update({
      ...schema,
      sections: [
        ...schema.sections,
        { id: newId().slice(0, 8), title: { en: "New section" }, fields: [] },
      ],
    });

  const patchSection = (i: number, patch: Partial<SectionDef>) =>
    update({
      ...schema,
      sections: schema.sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    });

  const removeSection = (i: number) =>
    update({ ...schema, sections: schema.sections.filter((_, idx) => idx !== i) });

  const addField = (si: number) =>
    patchSection(si, {
      fields: [
        ...schema.sections[si]!.fields,
        { id: newId().slice(0, 8), type: "text", label: { en: "New field" }, required: false },
      ],
    });

  const patchField = (si: number, fi: number, patch: Partial<FieldDef>) =>
    patchSection(si, {
      fields: schema.sections[si]!.fields.map((f, idx) => (idx === fi ? { ...f, ...patch } : f)),
    });

  const removeField = (si: number, fi: number) =>
    patchSection(si, { fields: schema.sections[si]!.fields.filter((_, idx) => idx !== fi) });

  return (
    <div className="flex flex-col gap-4">
      <Card
        title={
          <span className="flex items-center gap-2">
            <span className="font-mono">{editing.code}</span> v{editing.version}
            <StatusPill domain="document" status="draft" />
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            {saved && <span className="text-micro text-status-ok-fg">Saved</span>}
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await saveSchemaAction(editing.id, title, schema);
                setSaved(true);
              }}
            >
              Save
            </Button>
            <form action={publishTemplateAction.bind(null, editing.id)}>
              <Button size="sm" type="submit">
                Publish
              </Button>
            </form>
          </div>
        }
      >
        <label className="flex flex-col gap-1 text-small text-fg-secondary">
          Title
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <div className="mt-4 flex flex-col gap-4">
          {schema.sections.map((sec, si) => (
            <fieldset key={sec.id} className="rounded-md border border-default p-3">
              <div className="mb-2 flex items-center gap-2">
                <Input
                  className="flex-1"
                  value={sec.title.en}
                  onChange={(e) => patchSection(si, { title: { ...sec.title, en: e.target.value } })}
                  placeholder="Section title (en)"
                />
                <Input
                  className="flex-1"
                  value={sec.title.ar ?? ""}
                  onChange={(e) => patchSection(si, { title: { ...sec.title, ar: e.target.value } })}
                  placeholder="العنوان (ar)"
                />
                <Button variant="ghost" size="sm" onClick={() => removeSection(si)}>
                  Remove
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                {sec.fields.map((f, fi) => (
                  <div key={f.id} className="flex flex-wrap items-center gap-2 rounded-md bg-inset p-2">
                    <Select
                      className="w-32"
                      value={f.type}
                      onChange={(e) => patchField(si, fi, { type: e.target.value as FieldType })}
                      options={FIELD_TYPES.map((ft) => ({ value: ft, label: FIELD_TYPE_LABEL[ft] }))}
                    />
                    <Input
                      className="flex-1"
                      value={f.label.en}
                      onChange={(e) => patchField(si, fi, { label: { ...f.label, en: e.target.value } })}
                      placeholder="Label (en)"
                    />
                    <Input
                      className="flex-1"
                      value={f.label.ar ?? ""}
                      onChange={(e) => patchField(si, fi, { label: { ...f.label, ar: e.target.value } })}
                      placeholder="التسمية (ar)"
                    />
                    <Checkbox
                      label="Required"
                      checked={f.required}
                      onChange={(e) => patchField(si, fi, { required: e.target.checked })}
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeField(si, fi)}>
                      ✕
                    </Button>
                  </div>
                ))}
                <Button variant="secondary" size="sm" className="self-start" onClick={() => addField(si)}>
                  Add field
                </Button>
              </div>
            </fieldset>
          ))}
          <Button variant="secondary" size="sm" className="self-start" onClick={addSection}>
            Add section
          </Button>
        </div>
      </Card>

      <Card title="Preview">
        <FormRenderer schema={schema} />
      </Card>
    </div>
  );
}
