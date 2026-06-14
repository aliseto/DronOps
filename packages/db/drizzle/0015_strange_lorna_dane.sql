CREATE TABLE "mission_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"mission_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"flow" text NOT NULL,
	"kind" text NOT NULL,
	"label" text,
	"uploaded_by_person_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mission_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "missions" ALTER COLUMN "status" SET DEFAULT 'planning';--> statement-breakpoint
ALTER TABLE "missions" ADD COLUMN "authority" text;--> statement-breakpoint
ALTER TABLE "missions" ADD COLUMN "application_ref" text;--> statement-breakpoint
ALTER TABLE "missions" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "mission_documents" ADD CONSTRAINT "mission_documents_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_documents" ADD CONSTRAINT "mission_documents_uploaded_by_person_id_persons_id_fk" FOREIGN KEY ("uploaded_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mission_documents_org_mission_idx" ON "mission_documents" USING btree ("org_id","mission_id","flow");--> statement-breakpoint
CREATE POLICY "mission_documents_tenant_select" ON "mission_documents" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "mission_documents_tenant_insert" ON "mission_documents" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "mission_documents_tenant_update" ON "mission_documents" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
-- Re-anchor the mission seal: the immutable terminal is now 'flown' (the
-- completed-mission record), not 'sealed' (which the lifecycle no longer uses).
CREATE OR REPLACE FUNCTION enforce_mission_seal() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'missions cannot be deleted (append-only history)';
  END IF;
  IF OLD.status = 'flown' THEN
    RAISE EXCEPTION 'flown mission is immutable';
  END IF;
  RETURN NEW;
END $$;
