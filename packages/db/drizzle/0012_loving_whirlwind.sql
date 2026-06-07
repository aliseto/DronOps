CREATE TABLE "aircraft" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"label" text NOT NULL,
	"identifier" text,
	"airframe_class" text NOT NULL,
	"manufacturer" text,
	"model" text,
	"gaca_class" text,
	"registration_no" text,
	"registration_jurisdiction" text,
	"registration_issued_at" timestamp with time zone,
	"registration_expires_at" timestamp with time zone,
	"firmware_version" text,
	"condition" text DEFAULT 'operational' NOT NULL,
	"condition_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "aircraft" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "aircraft_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"label" text NOT NULL,
	"serial_no" text,
	"firmware_version" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "aircraft_components" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "maintenance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"type" text NOT NULL,
	"performed_at" timestamp with time zone NOT NULL,
	"description" text NOT NULL,
	"performed_by_person_id" uuid,
	"performed_by_name" text,
	"hours_at_service" numeric,
	"next_due_at" timestamp with time zone,
	"evidence_file_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "maintenance_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "aircraft_components" ADD CONSTRAINT "aircraft_components_aircraft_id_aircraft_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircraft"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_aircraft_id_aircraft_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircraft"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_performed_by_person_id_persons_id_fk" FOREIGN KEY ("performed_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "aircraft_org_identifier_idx" ON "aircraft" USING btree ("org_id","identifier");--> statement-breakpoint
CREATE INDEX "aircraft_components_org_aircraft_idx" ON "aircraft_components" USING btree ("org_id","aircraft_id");--> statement-breakpoint
CREATE INDEX "maintenance_records_org_aircraft_idx" ON "maintenance_records" USING btree ("org_id","aircraft_id","performed_at");--> statement-breakpoint
CREATE POLICY "aircraft_tenant_select" ON "aircraft" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "aircraft_tenant_insert" ON "aircraft" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "aircraft_tenant_update" ON "aircraft" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "aircraft_components_tenant_select" ON "aircraft_components" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "aircraft_components_tenant_insert" ON "aircraft_components" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "aircraft_components_tenant_update" ON "aircraft_components" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "maintenance_records_tenant_select" ON "maintenance_records" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "maintenance_records_tenant_insert" ON "maintenance_records" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "maintenance_records_tenant_update" ON "maintenance_records" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
-- maintenance_records are append-only logbook entries: narrow the grant + attach
-- the forbid_update_delete trigger (CLAUDE.md rule 1; mirrors files/recency_events).
GRANT SELECT, INSERT ON "maintenance_records" TO app_user;--> statement-breakpoint
CREATE TRIGGER "maintenance_records_append_only" BEFORE UPDATE OR DELETE ON "maintenance_records" FOR EACH ROW EXECUTE FUNCTION forbid_update_delete();
