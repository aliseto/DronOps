CREATE TABLE "mission_crew" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"mission_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"role" text NOT NULL,
	"override_reason" text,
	"overridden_by_person_id" uuid,
	"overridden_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mission_crew" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "mission_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"mission_id" uuid NOT NULL,
	"governorate" text,
	"wilayat" text,
	"village" text,
	"latitude" numeric,
	"longitude" numeric,
	"ceiling_m" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mission_locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"jurisdiction" text NOT NULL,
	"operational_category" text NOT NULL,
	"aircraft_id" uuid,
	"planned_start_at" timestamp with time zone,
	"planned_end_at" timestamp with time zone,
	"ceiling_m" numeric,
	"authorization_type" text,
	"authorization_ref" text,
	"media_attribution" boolean DEFAULT false NOT NULL,
	"green_zone_confirmed_by_person_id" uuid,
	"green_zone_confirmed_at" timestamp with time zone,
	"status" text DEFAULT 'draft' NOT NULL,
	"approved_by_person_id" uuid,
	"approved_at" timestamp with time zone,
	"signature_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "missions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "mission_crew" ADD CONSTRAINT "mission_crew_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_crew" ADD CONSTRAINT "mission_crew_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_crew" ADD CONSTRAINT "mission_crew_overridden_by_person_id_persons_id_fk" FOREIGN KEY ("overridden_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_locations" ADD CONSTRAINT "mission_locations_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_aircraft_id_aircraft_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircraft"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_green_zone_confirmed_by_person_id_persons_id_fk" FOREIGN KEY ("green_zone_confirmed_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_approved_by_person_id_persons_id_fk" FOREIGN KEY ("approved_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mission_crew_unique_idx" ON "mission_crew" USING btree ("org_id","mission_id","person_id","role");--> statement-breakpoint
CREATE INDEX "mission_locations_org_mission_idx" ON "mission_locations" USING btree ("org_id","mission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "missions_org_code_idx" ON "missions" USING btree ("org_id","code");--> statement-breakpoint
CREATE INDEX "missions_org_status_idx" ON "missions" USING btree ("org_id","status");--> statement-breakpoint
CREATE POLICY "mission_crew_tenant_select" ON "mission_crew" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "mission_crew_tenant_insert" ON "mission_crew" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "mission_crew_tenant_update" ON "mission_crew" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "mission_locations_tenant_select" ON "mission_locations" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "mission_locations_tenant_insert" ON "mission_locations" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "mission_locations_tenant_update" ON "mission_locations" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "missions_tenant_select" ON "missions" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "missions_tenant_insert" ON "missions" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "missions_tenant_update" ON "missions" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
-- Missions progress past 'approved' (→ in_progress → sealed), so the document
-- sealed-immutability rule (which freezes 'approved') doesn't fit. A mission is
-- immutable only once 'sealed'. DELETE is always forbidden (CLAUDE.md rule 1).
CREATE OR REPLACE FUNCTION enforce_mission_seal() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'missions cannot be deleted (append-only history)';
  END IF;
  IF OLD.status = 'sealed' THEN
    RAISE EXCEPTION 'sealed mission is immutable';
  END IF;
  RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER "missions_seal_immutability" BEFORE UPDATE OR DELETE ON "missions" FOR EACH ROW EXECUTE FUNCTION enforce_mission_seal();
