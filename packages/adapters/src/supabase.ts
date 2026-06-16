import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Adapters,
  AuthPort,
  JobQueuePort,
  NotifierPort,
  SchedulerPort,
  SecretsPort,
  StorageBucket,
  StoragePort,
} from "@dom/core";

/** AuthPort over a Supabase Auth client (server or browser). */
export function supabaseAuth(client: SupabaseClient): AuthPort {
  return {
    async getSession() {
      const { data } = await client.auth.getUser();
      const u = data.user;
      return u ? { userId: u.id, email: u.email ?? "" } : null;
    },
    async signInWithPassword(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw new Error(error?.message ?? "sign-in failed");
      return { userId: data.user.id, email: data.user.email ?? "" };
    },
    async signOut() {
      await client.auth.signOut();
    },
  };
}

/** StoragePort over Supabase Storage. Callers build org-scoped paths (orgId/…). */
export function supabaseStorage(client: SupabaseClient): StoragePort {
  return {
    async createSignedUploadUrl(bucket: StorageBucket, path: string) {
      const { data, error } = await client.storage.from(bucket).createSignedUploadUrl(path);
      if (error || !data) throw new Error(error?.message ?? "signed upload url failed");
      return { url: data.signedUrl, token: data.token };
    },
    async createSignedDownloadUrl(bucket: StorageBucket, path: string, expiresInSeconds = 3600) {
      const { data, error } = await client.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
      if (error || !data) throw new Error(error?.message ?? "signed download url failed");
      return data.signedUrl;
    },
    async remove(bucket: StorageBucket, path: string) {
      const { error } = await client.storage.from(bucket).remove([path]);
      if (error) throw new Error(error.message);
    },
  };
}

/** Secrets come from the environment (server-side only; Edge functions inject them). */
export function envSecrets(): SecretsPort {
  return {
    async get(key: string) {
      return process.env[key] ?? null;
    },
  };
}

/** In-app notification delivery (Realtime publishes the insert). Email is layered later. */
export function supabaseNotifier(client: SupabaseClient): NotifierPort {
  return {
    async notify({ userId, orgId, trigger, title, body }) {
      const { error } = await client
        .from("notifications")
        .insert({ org_id: orgId, target_user_id: userId, trigger, title, body });
      if (error) throw new Error(error.message);
    },
  };
}

/** Phase 0 placeholders — the job queue (Edge functions) and pg_cron scheduler
 * are wired in Phase 1+ when content modules need them. */
export function loggingJobs(): JobQueuePort {
  return {
    async enqueue(jobName, payload) {
      console.info("[jobs] enqueue (noop in Phase 0)", jobName, payload);
    },
  };
}

export function loggingScheduler(): SchedulerPort {
  return {
    async registerDaily(jobName, hourUtc) {
      console.info("[scheduler] registerDaily (noop in Phase 0)", jobName, hourUtc);
    },
  };
}

export function buildSupabaseAdapters(client: SupabaseClient): Adapters {
  return {
    auth: supabaseAuth(client),
    storage: supabaseStorage(client),
    jobs: loggingJobs(),
    scheduler: loggingScheduler(),
    secrets: envSecrets(),
    notifier: supabaseNotifier(client),
  };
}
