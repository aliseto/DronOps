import { auth } from "@/auth";

/** The current authenticated user, or null. Use in server components/actions. */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
