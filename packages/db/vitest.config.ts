import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // Allow server modules (import "server-only") to load under Node tests.
      "server-only": fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    name: "db",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
