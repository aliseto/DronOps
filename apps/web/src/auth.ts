import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getAdminDb } from "@dronops/db/client";
import { users } from "@dronops/db/schema";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Controlled e2e sign-in (only when explicitly enabled, never in production):
// lets Playwright exercise the gated app shell without a database.
function e2eUser(email: string, password: string) {
  if (
    process.env.AUTH_E2E_BYPASS === "1" &&
    process.env.NODE_ENV !== "production" &&
    email === "e2e@dronops.test" &&
    password === "e2e-password"
  ) {
    return { id: "e2e-user", email, name: "E2E User" };
  }
  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const bypass = e2eUser(email, password);
        if (bypass) return bypass;

        const db = getAdminDb();
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name ?? null };
      },
    }),
  ],
});
