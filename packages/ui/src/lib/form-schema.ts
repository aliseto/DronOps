/**
 * Form-template schema types consumed by FormRenderer. Kept local to the design
 * system (zod-free, plain types) so the kit stands alone. A host app may layer
 * its own validation (e.g. zod) on top of these shapes.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "photo"
  | "gps"
  | "signature";

export interface Bilingual {
  en: string;
  ar?: string;
}

export interface FieldDef {
  id: string;
  type: FieldType;
  label: Bilingual;
  required?: boolean;
  help?: Bilingual;
  /** options for type=select */
  options?: Bilingual[];
}

/** A section renders only when its condition (another field == value) holds. */
export interface SectionCondition {
  fieldId: string;
  equals: string;
}

export interface SectionDef {
  id: string;
  title: Bilingual;
  condition?: SectionCondition;
  fields: FieldDef[];
}

export interface FormSchema {
  sections: SectionDef[];
  signatureRequired?: boolean;
}

export const EMPTY_FORM_SCHEMA: FormSchema = { sections: [], signatureRequired: false };

/** Evaluate which sections are visible given current values (conditional logic). */
export function visibleSections(
  schema: FormSchema,
  values: Record<string, unknown>,
): SectionDef[] {
  return schema.sections.filter((s) => {
    if (!s.condition) return true;
    return String(values[s.condition.fieldId] ?? "") === s.condition.equals;
  });
}
