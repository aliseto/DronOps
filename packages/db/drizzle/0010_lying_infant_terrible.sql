CREATE TABLE "credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"jurisdiction" text,
	"authority" text,
	"credential_no" text,
	"issued_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_by_person_id" uuid,
	"verified_at" timestamp with time zone,
	"document_file_id" uuid,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credentials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "duty_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"mission_ref" text,
	"planned" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "duty_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "org_currency_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"operator_min_flights" integer,
	"operator_window_days" integer,
	"operator_per_airframe_class" boolean,
	"duty_overrides" jsonb,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "org_currency_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "recency_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"airframe_class" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"source_ref" text,
	"recorded_by_person_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recency_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_verified_by_person_id_persons_id_fk" FOREIGN KEY ("verified_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duty_records" ADD CONSTRAINT "duty_records_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recency_events" ADD CONSTRAINT "recency_events_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recency_events" ADD CONSTRAINT "recency_events_recorded_by_person_id_persons_id_fk" FOREIGN KEY ("recorded_by_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credentials_org_person_idx" ON "credentials" USING btree ("org_id","person_id");--> statement-breakpoint
CREATE INDEX "duty_records_org_person_idx" ON "duty_records" USING btree ("org_id","person_id","start_at");--> statement-breakpoint
CREATE UNIQUE INDEX "org_currency_rules_org_idx" ON "org_currency_rules" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "recency_events_org_person_type_idx" ON "recency_events" USING btree ("org_id","person_id","event_type");--> statement-breakpoint
CREATE UNIQUE INDEX "recency_events_m6_dedup_idx" ON "recency_events" USING btree ("org_id","source","source_ref","event_type") WHERE source = 'm6_flight' and source_ref is not null;--> statement-breakpoint
CREATE POLICY "credentials_tenant_select" ON "credentials" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "credentials_tenant_insert" ON "credentials" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "credentials_tenant_update" ON "credentials" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "duty_records_tenant_select" ON "duty_records" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "duty_records_tenant_insert" ON "duty_records" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "duty_records_tenant_update" ON "duty_records" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_currency_rules_tenant_select" ON "org_currency_rules" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_currency_rules_tenant_insert" ON "org_currency_rules" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_currency_rules_tenant_update" ON "org_currency_rules" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "recency_events_tenant_select" ON "recency_events" AS PERMISSIVE FOR SELECT TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "recency_events_tenant_insert" ON "recency_events" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "recency_events_tenant_update" ON "recency_events" AS PERMISSIVE FOR UPDATE TO "app_user" USING (org_id = current_setting('app.current_org_id', true)::uuid) WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);--> statement-breakpoint
-- recency_events are append-only evidence: narrow the grant and attach the
-- forbid_update_delete trigger (CLAUDE.md rule 1; mirrors files/signatures). The
-- update policy above is inert with no UPDATE grant + the trigger blocking it.
GRANT SELECT, INSERT ON "recency_events" TO app_user;--> statement-breakpoint
CREATE TRIGGER "recency_events_append_only" BEFORE UPDATE OR DELETE ON "recency_events" FOR EACH ROW EXECUTE FUNCTION forbid_update_delete();