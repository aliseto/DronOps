import { z } from "zod";

/**
 * Form-template schema (PR-014). Versioned templates; instances pin the template
 * version (each version is an immutable row). Bilingual labels scaffolded (en
 * required, ar optional). Field types include photo / GPS / signature.
 */

export const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "select",
  "checkbox",
  "photo",
  "gps",
  "signature",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const APPLIES_TO = [
  "generic",
  "mission_preflight",
  "postflight",
  "risk_assessment",
] as const;
export type AppliesTo = (typeof APPLIES_TO)[number];

export const bilingual = z.object({ en: z.string().min(1), ar: z.string().optional() });
export type Bilingual = z.infer<typeof bilingual>;

export const fieldDef = z.object({
  id: z.string().min(1),
  type: z.enum(FIELD_TYPES),
  label: bilingual,
  required: z.boolean().default(false),
  help: bilingual.optional(),
  /** options for type=select */
  options: z.array(bilingual).optional(),
});
export type FieldDef = z.infer<typeof fieldDef>;

/** A section renders only when its condition (another field == value) holds. */
export const sectionCondition = z.object({ fieldId: z.string().min(1), equals: z.string() });
export type SectionCondition = z.infer<typeof sectionCondition>;

export const sectionDef = z.object({
  id: z.string().min(1),
  title: bilingual,
  condition: sectionCondition.optional(),
  fields: z.array(fieldDef),
});
export type SectionDef = z.infer<typeof sectionDef>;

export const formSchema = z.object({
  sections: z.array(sectionDef),
  signatureRequired: z.boolean().default(false),
});
export type FormSchema = z.infer<typeof formSchema>;

export const EMPTY_FORM_SCHEMA: FormSchema = { sections: [], signatureRequired: false };

export type TemplateStatus = "draft" | "active" | "retired";

/** Evaluate which sections are visible given current values (conditional logic). */
export function visibleSections(schema: FormSchema, values: Record<string, unknown>): SectionDef[] {
  return schema.sections.filter((s) => {
    if (!s.condition) return true;
    return String(values[s.condition.fieldId] ?? "") === s.condition.equals;
  });
}

export const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: "Text",
  textarea: "Long text",
  number: "Number",
  date: "Date",
  select: "Select",
  checkbox: "Checkbox",
  photo: "Photo",
  gps: "GPS",
  signature: "Signature",
};
