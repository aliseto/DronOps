ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "authenticators" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "verification_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "webauthn_challenges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON "users", "accounts", "sessions", "verification_tokens", "authenticators", "webauthn_challenges" FROM anon, authenticated;
