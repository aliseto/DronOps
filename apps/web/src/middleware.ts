import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge middleware: session check + route protection via the `authorized`
// callback in authConfig (which redirects unauthenticated users in the (app)
// area to /signin). Uses the edge-safe config — no DB/Node imports here.
export default NextAuth(authConfig).auth;

export const config = {
  // Run on app routes; skip Next internals, the auth API, and static files.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
