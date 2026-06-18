import { createSupabaseServerClient } from "./supabase/server";

export interface SessionUser {
  id: string;
  email: string;
}

/**
 * The authenticated user from the request session, or null. Returns null (not
 * throw) if Supabase is unconfigured or the call fails, so pages degrade to the
 * sign-in flow instead of a 500.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    return data.user ? { id: data.user.id, email: data.user.email ?? "" } : null;
  } catch {
    return null;
  }
}
