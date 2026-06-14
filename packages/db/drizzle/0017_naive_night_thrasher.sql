CREATE TABLE "capa_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"finding_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"description" text NOT NULL,
	"owner_person_id" uuid,
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "capa_actions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"code" text NOT NULL,
	"jurisdiction" text,
	"source" text NOT NULL,
	"source_ref" text,
	"deviation_code" text,
	"level" text NOT NULL,
	"severity" text,
	"status" text DEFAULT 'open' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"evidence_file_id" uuid,
	"raised_by_person_id" uuid,
	"due_at" timestamp with time zone,
	"triaged_at" timestamp with time zone,
	"triage_decision" text,
	"triage_reason" text,
	"verified_by_person_id" uuid,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "findings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "capa_actions" ADD CONSTRAINT "capa_actions_finding_id_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."findings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capa_actions" ADD CONSTRAINT "capa_actions_owner_person_id_persons_id_fk" FOREIGN KEY ("owner_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_raised_by_person_id_persons_id_fk" FOREIGN KEY ("raised_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_verified_by_person_id_persons_id_fk" FOREIGN KEY ("verified_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "capa_actions_org_finding_idx" ON "capa_actions" USING btree ("org_id","finding_id");--> statement-breakpoint
CREATE INDEX "findings_org_status_idx" ON "findings" USING btree ("org_id","status");--> statement-breakpoint
CREATE POLICY "capa_actions_tenant_select" ON "capa_actions" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "capa_actions_tenant_insert" ON "capa_actions" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "capa_actions_tenant_update" ON "capa_actions" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "findings_tenant_select" ON "findings" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "findings_tenant_insert" ON "findings" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "findings_tenant_update" ON "findings" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
-- Segregation of duties (Hard Rule 4): the raiser cannot verify their own finding.
CREATE OR REPLACE FUNCTION enforce_finding_sod() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.verified_by_person_id IS NOT NULL AND NEW.verified_by_person_id = NEW.raised_by_person_id THEN
    RAISE EXCEPTION 'segregation of duties: the raiser cannot verify their own finding';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER findings_sod BEFORE INSERT OR UPDATE ON findings FOR EACH ROW EXECUTE FUNCTION enforce_finding_sod();
--> statement-breakpoint
-- Terminal states are immutable; no hard deletes (append-only; corrections = new findings).
CREATE OR REPLACE FUNCTION enforce_finding_terminal() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'findings cannot be deleted (append-only)'; END IF;
  IF OLD.status IN ('closed','false-positive') THEN RAISE EXCEPTION 'finding is % and immutable', OLD.status; END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER findings_terminal BEFORE UPDATE OR DELETE ON findings FOR EACH ROW EXECUTE FUNCTION enforce_finding_terminal();
