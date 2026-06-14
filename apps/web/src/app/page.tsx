import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

/** The app has no public marketing page: send visitors to sign in, and
 * already-authenticated users straight to their dashboard. */
export default async function HomePage() {
  const user = await getCurrentUser().catch(() => null);
  redirect(user?.id ? "/dashboard" : "/signin");
}
