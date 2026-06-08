CREATE TABLE "audit_packs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"frameworks" jsonb,
	"selection" jsonb,
	"scope_notes" text,
	"content_snapshot" jsonb,
	"sealed_by_person_id" uuid,
	"signature_id" uuid,
	"sealed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_packs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_packs" ADD CONSTRAINT "audit_packs_sealed_by_person_id_persons_id_fk" FOREIGN KEY ("sealed_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_packs" ADD CONSTRAINT "audit_packs_signature_id_signatures_id_fk" FOREIGN KEY ("signature_id") REFERENCES "public"."signatures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_packs_org_status_idx" ON "audit_packs" USING btree ("org_id","status");--> statement-breakpoint
CREATE POLICY "audit_packs_tenant_select" ON "audit_packs" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "audit_packs_tenant_insert" ON "audit_packs" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "audit_packs_tenant_update" ON "audit_packs" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
-- A sealed audit pack is immutable; no hard deletes (append-only; correct = new pack).
CREATE OR REPLACE FUNCTION enforce_audit_pack_immutability() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'audit packs cannot be deleted (append-only)'; END IF;
  IF OLD.status = 'sealed' THEN RAISE EXCEPTION 'audit pack % is sealed and immutable', OLD.code; END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER audit_packs_immutability BEFORE UPDATE OR DELETE ON audit_packs FOR EACH ROW EXECUTE FUNCTION enforce_audit_pack_immutability();