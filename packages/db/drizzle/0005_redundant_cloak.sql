CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"sha256" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"original_name" text,
	"storage_key" text NOT NULL,
	"grade" text,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "files" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"signer_person_id" uuid,
	"meaning" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"payload_hash" text NOT NULL,
	"method" text NOT NULL,
	"credential_id" text,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "signatures" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_signer_person_id_persons_id_fk" FOREIGN KEY ("signer_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "files_org_sha256_idx" ON "files" USING btree ("org_id","sha256");--> statement-breakpoint
CREATE INDEX "signatures_entity_idx" ON "signatures" USING btree ("org_id","entity_type","entity_id");--> statement-breakpoint
CREATE POLICY "files_tenant_select" ON "files" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "files_tenant_insert" ON "files" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "files_tenant_update" ON "files" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "signatures_tenant_select" ON "signatures" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "signatures_tenant_insert" ON "signatures" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "signatures_tenant_update" ON "signatures" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
-- Evidence files and signatures are immutable (append-only): grant SELECT/INSERT
-- only and attach the forbid_update_delete trigger (CLAUDE.md rules 5, 7).
GRANT SELECT, INSERT ON "files" TO app_user;--> statement-breakpoint
GRANT SELECT, INSERT ON "signatures" TO app_user;--> statement-breakpoint
CREATE TRIGGER "files_append_only" BEFORE UPDATE OR DELETE ON "files" FOR EACH ROW EXECUTE FUNCTION forbid_update_delete();--> statement-breakpoint
CREATE TRIGGER "signatures_append_only" BEFORE UPDATE OR DELETE ON "signatures" FOR EACH ROW EXECUTE FUNCTION forbid_update_delete();
