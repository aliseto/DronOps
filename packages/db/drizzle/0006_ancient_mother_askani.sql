CREATE TABLE "counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"requirement_ref" text NOT NULL,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_requirements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"rev_no" integer NOT NULL,
	"change_summary" text,
	"body_file_id" uuid,
	"body_rich" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"effective_at" timestamp with time zone,
	"approved_by_person_id" uuid,
	"signature_id" uuid,
	"superseded_by_revision_id" uuid,
	"superseded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_revisions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"category" text NOT NULL,
	"doc_no" text NOT NULL,
	"title" text NOT NULL,
	"owner_person_id" uuid,
	"jurisdiction_tags" text[],
	"current_revision_id" uuid,
	"review_due_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "document_requirements" ADD CONSTRAINT "document_requirements_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_revisions" ADD CONSTRAINT "document_revisions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_revisions" ADD CONSTRAINT "document_revisions_approved_by_person_id_persons_id_fk" FOREIGN KEY ("approved_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_person_id_persons_id_fk" FOREIGN KEY ("owner_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "counters_org_key_idx" ON "counters" USING btree ("org_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "document_requirements_active_idx" ON "document_requirements" USING btree ("org_id","document_id","requirement_ref") WHERE removed_at is null;--> statement-breakpoint
CREATE UNIQUE INDEX "document_revisions_org_doc_rev_idx" ON "document_revisions" USING btree ("org_id","document_id","rev_no");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_org_docno_idx" ON "documents" USING btree ("org_id","doc_no");--> statement-breakpoint
CREATE POLICY "counters_tenant_select" ON "counters" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "counters_tenant_insert" ON "counters" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "counters_tenant_update" ON "counters" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "document_requirements_tenant_select" ON "document_requirements" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "document_requirements_tenant_insert" ON "document_requirements" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "document_requirements_tenant_update" ON "document_requirements" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "document_revisions_tenant_select" ON "document_revisions" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "document_revisions_tenant_insert" ON "document_revisions" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "document_revisions_tenant_update" ON "document_revisions" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "documents_tenant_select" ON "documents" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "documents_tenant_insert" ON "documents" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "documents_tenant_update" ON "documents" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
-- Approved/obsolete revisions are immutable EXCEPT the single approved→obsolete
-- supersede transition (content frozen). draft/in_review remain freely mutable.
CREATE OR REPLACE FUNCTION enforce_doc_revision_immutability() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'document revisions cannot be deleted';
  END IF;
  IF OLD.status = 'obsolete' THEN
    RAISE EXCEPTION 'obsolete revision % is immutable', OLD.id;
  END IF;
  IF OLD.status = 'approved' THEN
    IF NEW.status = 'obsolete'
       AND NEW.id = OLD.id
       AND NEW.document_id = OLD.document_id
       AND NEW.rev_no = OLD.rev_no
       AND NEW.body_file_id IS NOT DISTINCT FROM OLD.body_file_id
       AND NEW.body_rich IS NOT DISTINCT FROM OLD.body_rich
       AND NEW.signature_id IS NOT DISTINCT FROM OLD.signature_id
       AND NEW.approved_by_person_id IS NOT DISTINCT FROM OLD.approved_by_person_id
       AND NEW.effective_at IS NOT DISTINCT FROM OLD.effective_at
    THEN
      RETURN NEW; -- allow the supersede transition only
    END IF;
    RAISE EXCEPTION 'approved revision % is immutable (only superseding is allowed)', OLD.id;
  END IF;
  RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER "document_revisions_immutability" BEFORE UPDATE OR DELETE ON "document_revisions" FOR EACH ROW EXECUTE FUNCTION enforce_doc_revision_immutability();
