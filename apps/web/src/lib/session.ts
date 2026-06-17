import { createSupabaseServerClient } from "./supabase/server";

export interface SessionUser {
  id: string;
  email: string;
}

/** The authenticated user from the request session, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? "" } : null;
}
