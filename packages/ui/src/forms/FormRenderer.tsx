"use client";

import { useState } from "react";
import type { FormSchema, FieldDef, Bilingual } from "@dronops/shared";
import { visibleSections } from "@dronops/shared";
import { cn } from "../lib/cn";

const label = (b: Bilingual, locale: "en" | "ar") => (locale === "ar" && b.ar ? b.ar : b.en);

/**
 * Renders a form template schema as a fillable form. Conditional sections show/
 * hide by current values. Used for builder preview now and form instances later.
 */
export function FormRenderer({
  schema,
  locale = "en",
  className,
}: {
  schema: FormSchema;
  locale?: "en" | "ar";
  className?: string;
}) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const set = (id: string, v: unknown) => setValues((s) => ({ ...s, [id]: v }));
  const sections = visibleSections(schema, values);

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {sections.length === 0 && <p className="text-small text-fg-muted">No sections yet.</p>}
      {sections.map((sec) => (
        <fieldset key={sec.id} className="flex flex-col gap-3 rounded-md border border-subtle p-3">
          <legend className="px-1 text-small font-semibold text-fg-primary">
            {label(sec.title, locale)}
          </legend>
          {sec.fields.map((f) => (
            <Field key={f.id} field={f} locale={locale} value={values[f.id]} onChange={(v) => set(f.id, v)} />
          ))}
        </fieldset>
      ))}
      {schema.signatureRequired && (
        <p className="text-micro text-fg-muted">Signature required on submission.</p>
      )}
    </div>
  );
}

function Field({
  field,
  locale,
  value,
  onChange,
}: {
  field: FieldDef;
  locale: "en" | "ar";
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const lbl = (
    <span className="text-small text-fg-secondary">
      {label(field.label, locale)}
      {field.required && <span className="ms-0.5 text-status-danger-fg">*</span>}
    </span>
  );
  const input =
    "rounded-md border border-default bg-inset px-3 py-2 text-body text-fg-primary focus-visible:border-focus";

  switch (field.type) {
    case "textarea":
      return (
        <label className="flex flex-col gap-1">
          {lbl}
          <textarea className={cn(input, "min-h-20")} onChange={(e) => onChange(e.target.value)} />
        </label>
      );
    case "select":
      return (
        <label className="flex flex-col gap-1">
          {lbl}
          <select className={input} onChange={(e) => onChange(e.target.value)} defaultValue="">
            <option value="" disabled>
              Select…
            </option>
            {(field.options ?? []).map((o, i) => (
              <option key={i} value={o.en}>
                {label(o, locale)}
              </option>
            ))}
          </select>
        </label>
      );
    case "checkbox":
      return (
        <label className="inline-flex items-center gap-2 text-small text-fg-secondary">
          <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" onChange={(e) => onChange(e.target.checked)} />
          {label(field.label, locale)}
        </label>
      );
    case "number":
    case "date":
    case "text":
      return (
        <label className="flex flex-col gap-1">
          {lbl}
          <input
            type={field.type === "text" ? "text" : field.type}
            className={input}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      );
    case "photo":
      return (
        <label className="flex flex-col gap-1">
          {lbl}
          <input type="file" accept="image/*" capture="environment" className="text-small text-fg-secondary" onChange={(e) => onChange(e.target.files?.[0]?.name)} />
        </label>
      );
    case "gps":
      return (
        <div className="flex flex-col gap-1">
          {lbl}
          <button
            type="button"
            className="self-start rounded-md border border-default px-3 py-1.5 text-small text-fg-secondary hover:bg-hover"
            onClick={() => onChange("captured")}
          >
            {value ? "GPS captured" : "Capture GPS"}
          </button>
        </div>
      );
    case "signature":
      return (
        <div className="flex flex-col gap-1">
          {lbl}
          <div className="flex h-16 items-center justify-center rounded-md border border-dashed border-default text-micro text-fg-muted">
            Signature pad
          </div>
        </div>
      );
  }
}
