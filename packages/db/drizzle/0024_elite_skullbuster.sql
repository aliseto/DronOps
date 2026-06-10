CREATE TABLE "sora_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"mission_id" uuid,
	"scenario" text NOT NULL,
	"dimension" text NOT NULL,
	"m1" text DEFAULT 'none' NOT NULL,
	"m2" text DEFAULT 'none' NOT NULL,
	"m3" text DEFAULT 'none' NOT NULL,
	"initial_arc" text NOT NULL,
	"arc_reduction" integer DEFAULT 0 NOT NULL,
	"intrinsic_grc" integer,
	"final_grc" integer,
	"residual_arc" text,
	"sail" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"approved_by_person_id" uuid,
	"signature_id" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sora_assessments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sora_assessments" ADD CONSTRAINT "sora_assessments_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sora_assessments" ADD CONSTRAINT "sora_assessments_approved_by_person_id_persons_id_fk" FOREIGN KEY ("approved_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sora_assessments" ADD CONSTRAINT "sora_assessments_signature_id_signatures_id_fk" FOREIGN KEY ("signature_id") REFERENCES "public"."signatures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sora_assessments_org_status_idx" ON "sora_assessments" USING btree ("org_id","status");--> statement-breakpoint
CREATE POLICY "sora_assessments_tenant_select" ON "sora_assessments" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "sora_assessments_tenant_insert" ON "sora_assessments" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "sora_assessments_tenant_update" ON "sora_assessments" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
-- An approved SORA assessment is immutable; no hard deletes (append-only; correct = new assessment).
CREATE OR REPLACE FUNCTION enforce_sora_immutability() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'SORA assessments cannot be deleted (append-only)'; END IF;
  IF OLD.status = 'approved' THEN RAISE EXCEPTION 'SORA assessment % is approved and immutable', OLD.code; END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER sora_assessments_immutability BEFORE UPDATE OR DELETE ON sora_assessments FOR EACH ROW EXECUTE FUNCTION enforce_sora_immutability();
