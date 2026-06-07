import { describe, it, expect } from "vitest";
import { formSchema, visibleSections, type FormSchema } from "./form-templates";

const schema: FormSchema = {
  signatureRequired: false,
  sections: [
    { id: "base", title: { en: "Base" }, fields: [{ id: "night", type: "checkbox", label: { en: "Night?" }, required: false }] },
    {
      id: "night-only",
      title: { en: "Night ops" },
      condition: { fieldId: "night", equals: "true" },
      fields: [{ id: "lights", type: "text", label: { en: "Lighting" }, required: true }],
    },
  ],
};

describe("form templates", () => {
  it("validates the schema shape", () => {
    expect(formSchema.safeParse(schema).success).toBe(true);
  });

  it("hides conditional sections until the condition holds", () => {
    expect(visibleSections(schema, {}).map((s) => s.id)).toEqual(["base"]);
    expect(visibleSections(schema, { night: "true" }).map((s) => s.id)).toEqual([
      "base",
      "night-only",
    ]);
  });
});
