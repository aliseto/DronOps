// Jurisdiction rule data (deadlines, retention, CAPA, completeness, gates).
// Pure, versioned, zod-validated at import. The jurisdiction engine in
// @dronops/shared reads these — engine functions never embed values.
export * from "./deadlines";
export * from "./retention";
export * from "./capa";
export * from "./completeness";
export * from "./gates";
