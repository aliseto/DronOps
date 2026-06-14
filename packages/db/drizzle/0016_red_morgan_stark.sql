CREATE TABLE "mission_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"mission_id" uuid NOT NULL,
	"author_person_id" uuid,
	"body" text NOT NULL,
	"file_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mission_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "mission_notes" ADD CONSTRAINT "mission_notes_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_notes" ADD CONSTRAINT "mission_notes_author_person_id_persons_id_fk" FOREIGN KEY ("author_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mission_notes_org_mission_idx" ON "mission_notes" USING btree ("org_id","mission_id");--> statement-breakpoint
CREATE POLICY "mission_notes_tenant_select" ON "mission_notes" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "mission_notes_tenant_insert" ON "mission_notes" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "mission_notes_tenant_update" ON "mission_notes" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
-- Append-only: notes cannot be edited or deleted (audit ethos).
CREATE OR REPLACE FUNCTION enforce_mission_note_append_only() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'mission notes are append-only (no edit or delete)';
END $$;
--> statement-breakpoint
CREATE TRIGGER mission_notes_append_only BEFORE UPDATE OR DELETE ON mission_notes
  FOR EACH ROW EXECUTE FUNCTION enforce_mission_note_append_only();
