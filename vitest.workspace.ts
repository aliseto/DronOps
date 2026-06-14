import { defineWorkspace } from "vitest/config";

// Each package opts in by adding a vitest.config.ts; this workspace file
// discovers them so `pnpm test` runs the whole suite from the root.
export default defineWorkspace(["packages/*/vitest.config.ts"]);
