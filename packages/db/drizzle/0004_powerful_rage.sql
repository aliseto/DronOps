-- ============================================================================
-- audit_events → monthly RANGE partitioning (created_at). The table is empty at
-- this point; drop + recreate as partitioned (a table cannot be converted in
-- place). Composite PK includes the partition key. Re-add RLS, grant, policies,
-- and the append-only trigger. Monthly partitions seeded 2026–2027 + a DEFAULT
-- catch-all; an Inngest job will roll new months forward later.
-- ============================================================================
DROP TABLE "audit_events";--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"before" jsonb,
	"after" jsonb,
	"amr" text,
	"context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_events_id_created_at_pk" PRIMARY KEY ("id","created_at")
) PARTITION BY RANGE ("created_at");--> statement-breakpoint
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
GRANT SELECT, INSERT ON "audit_events" TO app_user;--> statement-breakpoint
CREATE INDEX "audit_events_org_created_idx" ON "audit_events" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_events_entity_idx" ON "audit_events" USING btree ("org_id","entity_type","entity_id");--> statement-breakpoint
CREATE POLICY "audit_events_tenant_select" ON "audit_events" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "audit_events_tenant_insert" ON "audit_events" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "audit_events_tenant_update" ON "audit_events" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE TRIGGER "audit_events_append_only" BEFORE UPDATE OR DELETE ON "audit_events" FOR EACH ROW EXECUTE FUNCTION forbid_update_delete();--> statement-breakpoint
DO $$ DECLARE d date := date '2026-01-01';
BEGIN
  WHILE d < date '2028-01-01' LOOP
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_events FOR VALUES FROM (%L) TO (%L)',
      'audit_events_' || to_char(d, 'YYYYMM'), d, (d + interval '1 month'));
    d := d + interval '1 month';
  END LOOP;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_events_default" PARTITION OF "audit_events" DEFAULT;--> statement-breakpoint

-- ============================================================================
-- persons / user_persons / person_roles (operational identity + domain RBAC).
-- ============================================================================
CREATE TABLE "persons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"identity_no" text,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"employment_status" text DEFAULT 'active' NOT NULL,
	"employment_end_at" timestamp with time zone,
	"photo_file_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "persons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_persons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"person_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_persons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "person_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"role" text NOT NULL,
	"granted_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "person_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_persons" ADD CONSTRAINT "user_persons_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_roles" ADD CONSTRAINT "person_roles_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "persons_org_identity_idx" ON "persons" USING btree ("org_id","identity_no");--> statement-breakpoint
CREATE UNIQUE INDEX "user_persons_org_user_idx" ON "user_persons" USING btree ("org_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_persons_org_person_idx" ON "user_persons" USING btree ("org_id","person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "person_roles_org_person_role_idx" ON "person_roles" USING btree ("org_id","person_id","role");--> statement-breakpoint
CREATE POLICY "persons_tenant_select" ON "persons" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "persons_tenant_insert" ON "persons" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "persons_tenant_update" ON "persons" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "user_persons_tenant_select" ON "user_persons" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "user_persons_tenant_insert" ON "user_persons" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "user_persons_tenant_update" ON "user_persons" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "person_roles_tenant_select" ON "person_roles" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "person_roles_tenant_insert" ON "person_roles" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "person_roles_tenant_update" ON "person_roles" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);
