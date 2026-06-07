import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Content-addressed evidence storage (Supabase Storage). Uses the service role
// key (server only). Keys are tenant/{org}/sha256/{hash} so identical content
// dedupes naturally. Provisioned per environment via env (not in repo).
const BUCKET = process.env.STORAGE_BUCKET ?? "evidence";

let _client: SupabaseClient | undefined;
function client(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL ?? "http://localhost",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? "service-role-key",
      { auth: { persistSession: false } },
    );
  }
  return _client;
}

export function storageKey(orgId: string, sha256: string): string {
  return `${orgId}/sha256/${sha256}`;
}

export async function putObject(
  orgId: string,
  sha256: string,
  bytes: Uint8Array,
  mime: string,
): Promise<string> {
  const key = storageKey(orgId, sha256);
  const { error } = await client().storage.from(BUCKET).upload(key, bytes, {
    contentType: mime,
    upsert: true, // content-addressed: re-uploading identical bytes is a no-op
  });
  if (error) throw new Error(`storage upload failed: ${error.message}`);
  return key;
}

export async function signedUrl(key: string, expiresIn = 300): Promise<string | null> {
  const { data } = await client().storage.from(BUCKET).createSignedUrl(key, expiresIn);
  return data?.signedUrl ?? null;
}
