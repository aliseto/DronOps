CREATE TABLE "hazards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"source" text DEFAULT 'manual' NOT NULL,
	"source_ref" text,
	"status" text DEFAULT 'open' NOT NULL,
	"owner_person_id" uuid,
	"likelihood" integer,
	"severity" integer,
	"mitigations" text,
	"residual_likelihood" integer,
	"residual_severity" integer,
	"review_interval_days" integer,
	"last_reviewed_at" timestamp with time zone,
	"next_review_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hazards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hazards" ADD CONSTRAINT "hazards_owner_person_id_persons_id_fk" FOREIGN KEY ("owner_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hazards_org_status_idx" ON "hazards" USING btree ("org_id","status");--> statement-breakpoint
CREATE POLICY "hazards_tenant_select" ON "hazards" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "hazards_tenant_insert" ON "hazards" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "hazards_tenant_update" ON "hazards" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);