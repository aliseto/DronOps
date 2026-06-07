import { defineConfig } from "drizzle-kit";

// Migrations use the DIRECT connection (DDL + advisory locks don't work through
// the transaction pooler). Never `drizzle-kit push` — RLS policies don't apply
// reliably via push; always generate -> migrate.
export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_DATABASE_URL ?? "postgresql://localhost:5432/placeholder",
  },
  casing: "snake_case",
  // Don't let drizzle-kit try to manage Supabase's built-in roles.
  entities: {
    roles: {
      provider: undefined,
      exclude: ["postgres", "anon", "authenticated", "service_role", "supabase_admin"],
    },
  },
  verbose: true,
  strict: true,
});
