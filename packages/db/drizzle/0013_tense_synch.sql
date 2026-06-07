CREATE TABLE "flight_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"pilot_person_id" uuid,
	"jurisdiction" text,
	"mission_ref" text,
	"flown_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_sec" integer,
	"block_time_sec" integer,
	"max_altitude_m" numeric,
	"max_distance_m" numeric,
	"min_battery_pct" integer,
	"sample_count" integer,
	"ceiling_m" numeric,
	"source" text DEFAULT 'dji-csv' NOT NULL,
	"evidence_file_id" uuid,
	"deviations" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"reconciled_by_person_id" uuid,
	"sealed_at" timestamp with time zone,
	"signature_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flight_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "flight_records" ADD CONSTRAINT "flight_records_aircraft_id_aircraft_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircraft"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_records" ADD CONSTRAINT "flight_records_pilot_person_id_persons_id_fk" FOREIGN KEY ("pilot_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_records" ADD CONSTRAINT "flight_records_reconciled_by_person_id_persons_id_fk" FOREIGN KEY ("reconciled_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "flight_records_org_aircraft_idx" ON "flight_records" USING btree ("org_id","aircraft_id","flown_at");--> statement-breakpoint
CREATE POLICY "flight_records_tenant_select" ON "flight_records" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "flight_records_tenant_insert" ON "flight_records" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "flight_records_tenant_update" ON "flight_records" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
-- Sealed flight records are immutable (CLAUDE.md rule 5) — enforced by trigger.
CREATE TRIGGER "flight_records_sealed_immutability" BEFORE UPDATE OR DELETE ON "flight_records" FOR EACH ROW EXECUTE FUNCTION enforce_sealed_immutability();
