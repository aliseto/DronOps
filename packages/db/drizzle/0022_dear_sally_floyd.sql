CREATE TABLE "risk_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"code" text NOT NULL,
	"mission_id" uuid NOT NULL,
	"profile" text NOT NULL,
	"title" text NOT NULL,
	"template_id" uuid,
	"template_code" text,
	"template_version" integer,
	"data" jsonb,
	"residual_risk" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"approved_by_person_id" uuid,
	"signature_id" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "risk_assessments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "missions" ADD COLUMN "flight_profiles" jsonb;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_template_id_form_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."form_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_approved_by_person_id_persons_id_fk" FOREIGN KEY ("approved_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_signature_id_signatures_id_fk" FOREIGN KEY ("signature_id") REFERENCES "public"."signatures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "risk_assessments_org_mission_idx" ON "risk_assessments" USING btree ("org_id","mission_id");--> statement-breakpoint
CREATE POLICY "risk_assessments_tenant_select" ON "risk_assessments" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "risk_assessments_tenant_insert" ON "risk_assessments" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "risk_assessments_tenant_update" ON "risk_assessments" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
-- An approved risk assessment is immutable; no hard deletes (append-only; correct = new assessment).
CREATE OR REPLACE FUNCTION enforce_risk_assessment_immutability() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'risk assessments cannot be deleted (append-only)'; END IF;
  IF OLD.status = 'approved' THEN RAISE EXCEPTION 'risk assessment % is approved and immutable', OLD.code; END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER risk_assessments_immutability BEFORE UPDATE OR DELETE ON risk_assessments FOR EACH ROW EXECUTE FUNCTION enforce_risk_assessment_immutability();