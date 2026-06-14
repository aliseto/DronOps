CREATE TABLE "form_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"template_code" text NOT NULL,
	"template_version" integer NOT NULL,
	"mission_id" uuid,
	"data" jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"captured_at" timestamp with time zone,
	"synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "form_instances" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "form_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"code" text NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"applies_to" text DEFAULT 'generic' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"schema" jsonb NOT NULL,
	"superseded_by_version_id" uuid,
	"superseded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "form_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_instances" ADD CONSTRAINT "form_instances_template_id_form_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."form_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_instances_template_idx" ON "form_instances" USING btree ("org_id","template_id");--> statement-breakpoint
CREATE UNIQUE INDEX "form_templates_org_code_version_idx" ON "form_templates" USING btree ("org_id","code","version");--> statement-breakpoint
CREATE POLICY "form_instances_tenant_select" ON "form_instances" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "form_instances_tenant_insert" ON "form_instances" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "form_instances_tenant_update" ON "form_instances" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "form_templates_tenant_select" ON "form_templates" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "form_templates_tenant_insert" ON "form_templates" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "form_templates_tenant_update" ON "form_templates" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
-- Template versions are immutable once active/retired, except the single
-- active→retired supersede transition (schema frozen). Drafts stay mutable.
CREATE OR REPLACE FUNCTION enforce_form_template_immutability() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'form template versions cannot be deleted';
  END IF;
  IF OLD.status = 'retired' THEN
    RAISE EXCEPTION 'retired template version % is immutable', OLD.id;
  END IF;
  IF OLD.status = 'active' THEN
    IF NEW.status = 'retired'
       AND NEW.id = OLD.id AND NEW.code = OLD.code AND NEW.version = OLD.version
       AND NEW.schema IS NOT DISTINCT FROM OLD.schema
       AND NEW.title IS NOT DISTINCT FROM OLD.title
    THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'active template version % is immutable (only retiring is allowed)', OLD.id;
  END IF;
  RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER "form_templates_immutability" BEFORE UPDATE OR DELETE ON "form_templates" FOR EACH ROW EXECUTE FUNCTION enforce_form_template_immutability();
