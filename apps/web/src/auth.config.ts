import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config: no adapter, no DB, no Node-only providers. Imported by
 * middleware (edge runtime) and spread into the full config in auth.ts. Keep
 * heavy imports OUT of this file.
 */
export const authConfig = {
  pages: {
    signIn: "/signin",
  },
  session: {
    // Credentials provider requires JWT sessions (Auth.js limitation).
    strategy: "jwt",
  },
  callbacks: {
    // Route protection for middleware: gate the (app) area.
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAppArea =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/documents") ||
        pathname.startsWith("/compliance") ||
        pathname.startsWith("/safety") ||
        pathname.startsWith("/operations") ||
        pathname.startsWith("/fleet") ||
        pathname.startsWith("/evidence") ||
        pathname.startsWith("/personnel") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/onboarding");
      if (isAppArea) return !!auth?.user;
      return true;
    },
    jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      return session;
    },
  },
  providers: [], // real providers are added in auth.ts (Node runtime)
} satisfies NextAuthConfig;
