import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { name: "parsers", environment: "node", include: ["src/**/*.test.ts"] },
});
