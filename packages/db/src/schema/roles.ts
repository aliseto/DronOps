import { pgRole } from "drizzle-orm/pg-core";

/**
 * The restricted application role used by the request path. Declared `.existing()`
 * because it is created (with NOBYPASSRLS + LOGIN) in the bootstrap migration —
 * drizzle should reference it in policies, not try to manage it.
 *
 * This role is the real tenant-isolation backstop: even if the GUC tenant
 * context is wrong or unset, app_user cannot bypass RLS, and there is no DELETE
 * policy for it, so hard deletes are impossible.
 */
export const appUser = pgRole("app_user").existing();
