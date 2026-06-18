import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client (bypasses RLS). Server-only. Used for storage
 * uploads/downloads and platform/system writes (e.g. the system_events
 * dead-letter, which has no authenticated insert policy).
 */
export function createSupabaseAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
