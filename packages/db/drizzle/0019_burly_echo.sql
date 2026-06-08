CREATE TABLE "management_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"prior_actions" text,
	"customer_feedback" text,
	"risk_effectiveness" text,
	"improvements" text,
	"resource_notes" text,
	"outputs" text,
	"inputs_snapshot" jsonb,
	"signed_by_person_id" uuid,
	"signature_id" uuid,
	"signed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "management_reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "management_reviews" ADD CONSTRAINT "management_reviews_signed_by_person_id_persons_id_fk" FOREIGN KEY ("signed_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "management_reviews" ADD CONSTRAINT "management_reviews_signature_id_signatures_id_fk" FOREIGN KEY ("signature_id") REFERENCES "public"."signatures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "management_reviews_org_status_idx" ON "management_reviews" USING btree ("org_id","status");--> statement-breakpoint
CREATE POLICY "management_reviews_tenant_select" ON "management_reviews" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "management_reviews_tenant_insert" ON "management_reviews" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "management_reviews_tenant_update" ON "management_reviews" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
-- A signed §9.3 review is immutable; no hard deletes (append-only; revise = new review).
CREATE OR REPLACE FUNCTION enforce_management_review_immutability() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'management reviews cannot be deleted (append-only)'; END IF;
  IF OLD.status = 'signed' THEN RAISE EXCEPTION 'management review % is signed and immutable', OLD.code; END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER management_reviews_immutability BEFORE UPDATE OR DELETE ON management_reviews FOR EACH ROW EXECUTE FUNCTION enforce_management_review_immutability();
