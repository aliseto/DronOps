CREATE TABLE "requirement_coverage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"requirement_ref" text NOT NULL,
	"status" text DEFAULT 'gap' NOT NULL,
	"controlling_document_id" uuid,
	"note" text,
	"reviewed_by_person_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "requirement_coverage" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "requirement_coverage" ADD CONSTRAINT "requirement_coverage_reviewed_by_person_id_persons_id_fk" FOREIGN KEY ("reviewed_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "requirement_coverage_unique_idx" ON "requirement_coverage" USING btree ("org_id","requirement_ref");--> statement-breakpoint
CREATE INDEX "requirement_coverage_org_status_idx" ON "requirement_coverage" USING btree ("org_id","status");--> statement-breakpoint
CREATE POLICY "requirement_coverage_tenant_select" ON "requirement_coverage" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "requirement_coverage_tenant_insert" ON "requirement_coverage" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "requirement_coverage_tenant_update" ON "requirement_coverage" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);