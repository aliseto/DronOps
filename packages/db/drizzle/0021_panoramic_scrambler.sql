CREATE TABLE "occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"code" text NOT NULL,
	"classification" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"jurisdiction" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"reported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reported_by_person_id" uuid,
	"mission_id" uuid,
	"flight_record_id" uuid,
	"aircraft_id" uuid,
	"pilot_person_id" uuid,
	"reporting_due_at" timestamp with time zone,
	"reporting_clause" text,
	"reported_to_regulator_at" timestamp with time zone,
	"status" text DEFAULT 'open' NOT NULL,
	"investigation_summary" text,
	"root_cause" text,
	"escalated_finding_id" uuid,
	"escalated_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"closed_by_person_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "occurrences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_reported_by_person_id_persons_id_fk" FOREIGN KEY ("reported_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_flight_record_id_flight_records_id_fk" FOREIGN KEY ("flight_record_id") REFERENCES "public"."flight_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_aircraft_id_aircraft_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircraft"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_pilot_person_id_persons_id_fk" FOREIGN KEY ("pilot_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_escalated_finding_id_findings_id_fk" FOREIGN KEY ("escalated_finding_id") REFERENCES "public"."findings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_closed_by_person_id_persons_id_fk" FOREIGN KEY ("closed_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "occurrences_org_status_idx" ON "occurrences" USING btree ("org_id","status");--> statement-breakpoint
CREATE POLICY "occurrences_tenant_select" ON "occurrences" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "occurrences_tenant_insert" ON "occurrences" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "occurrences_tenant_update" ON "occurrences" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
-- A closed occurrence is immutable; no hard deletes (append-only; correct = new occurrence).
CREATE OR REPLACE FUNCTION enforce_occurrence_immutability() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'occurrences cannot be deleted (append-only)'; END IF;
  IF OLD.status = 'closed' THEN RAISE EXCEPTION 'occurrence % is closed and immutable', OLD.code; END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER occurrences_immutability BEFORE UPDATE OR DELETE ON occurrences FOR EACH ROW EXECUTE FUNCTION enforce_occurrence_immutability();