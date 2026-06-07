-- ============================================================================
-- Bootstrap: restricted application role (the tenant-isolation backstop).
-- app_user is NOBYPASSRLS and is granted SELECT/INSERT/UPDATE only — never
-- DELETE — so hard deletes are impossible regardless of RLS policies.
-- LOGIN + password are provisioned out-of-band per environment (not in repo).
-- ============================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOLOGIN NOBYPASSRLS;
  END IF;
END $$;--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO app_user;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO app_user;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;--> statement-breakpoint

-- ============================================================================
-- Immutability + segregation-of-duties primitives. Functions are defined now;
-- triggers attach to domain tables as they arrive (CLAUDE.md rules 1, 4, 5).
-- ============================================================================
CREATE OR REPLACE FUNCTION forbid_update_delete() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'append-only: % not allowed on %', TG_OP, TG_TABLE_NAME;
END $$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION forbid_delete() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'hard delete forbidden on % — use soft-delete', TG_TABLE_NAME;
END $$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_sealed_immutability() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF OLD.status IS NOT NULL
     AND OLD.status IN ('sealed','approved','effective','closed','obsolete') THEN
    RAISE EXCEPTION 'record % is % and immutable; use the amendment/supersede path',
      OLD.id, OLD.status;
  END IF;
  RETURN NEW;
END $$;--> statement-breakpoint
-- SoD invariant helper. Privileged transitions wrap this in SECURITY DEFINER
-- functions owned by a privileged role and GRANT EXECUTE to app_user.
CREATE OR REPLACE FUNCTION fn_assert_distinct_actors(actor_a uuid, actor_b uuid, what text)
RETURNS void LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF actor_a IS NOT DISTINCT FROM actor_b THEN
    RAISE EXCEPTION 'segregation of duties: % requires two distinct people', what;
  END IF;
END $$;--> statement-breakpoint

-- ============================================================================
-- Schema (generated from Drizzle) + audit_events append-only trigger.
-- ============================================================================
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"before" jsonb,
	"after" jsonb,
	"amr" text,
	"context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
GRANT SELECT, INSERT ON "audit_events" TO app_user;--> statement-breakpoint
CREATE INDEX "audit_events_org_created_idx" ON "audit_events" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_events_entity_idx" ON "audit_events" USING btree ("org_id","entity_type","entity_id");--> statement-breakpoint
CREATE POLICY "audit_events_tenant_select" ON "audit_events" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "audit_events_tenant_insert" ON "audit_events" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "audit_events_tenant_update" ON "audit_events" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE TRIGGER "audit_events_append_only" BEFORE UPDATE OR DELETE ON "audit_events" FOR EACH ROW EXECUTE FUNCTION forbid_update_delete();
