CREATE TABLE "document_acks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"distribution_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"acked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_acks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_distributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"revision_id" uuid NOT NULL,
	"audience_type" text NOT NULL,
	"audience_ref" text NOT NULL,
	"ack_required" boolean DEFAULT true NOT NULL,
	"due_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_distributions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "document_acks" ADD CONSTRAINT "document_acks_distribution_id_document_distributions_id_fk" FOREIGN KEY ("distribution_id") REFERENCES "public"."document_distributions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_acks" ADD CONSTRAINT "document_acks_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_distributions" ADD CONSTRAINT "document_distributions_revision_id_document_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."document_revisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "document_acks_dist_person_idx" ON "document_acks" USING btree ("org_id","distribution_id","person_id");--> statement-breakpoint
CREATE INDEX "document_distributions_revision_idx" ON "document_distributions" USING btree ("org_id","revision_id");--> statement-breakpoint
CREATE POLICY "document_acks_tenant_select" ON "document_acks" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "document_acks_tenant_insert" ON "document_acks" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "document_acks_tenant_update" ON "document_acks" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "document_distributions_tenant_select" ON "document_distributions" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "document_distributions_tenant_insert" ON "document_distributions" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "document_distributions_tenant_update" ON "document_distributions" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
-- An acknowledgement is an immutable record (append-only).
GRANT SELECT, INSERT ON "document_acks" TO app_user;--> statement-breakpoint
CREATE TRIGGER "document_acks_append_only" BEFORE UPDATE OR DELETE ON "document_acks" FOR EACH ROW EXECUTE FUNCTION forbid_update_delete();
