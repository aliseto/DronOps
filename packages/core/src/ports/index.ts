/**
 * Adapter ports — the provider-neutral seams of the portable core. Nothing here
 * imports Supabase (or any provider); @dom/adapters supplies implementations.
 * The data + compliance core is coded against these interfaces so swapping
 * clouds is an adapter change, not a rewrite (Spec §2.6).
 */

export interface Session {
  userId: string;
  email: string;
}

export interface AuthPort {
  /** Current authenticated session, or null. */
  getSession(): Promise<Session | null>;
  signInWithPassword(email: string, password: string): Promise<Session>;
  signOut(): Promise<void>;
}

/** The four content-addressed buckets; every path is prefixed `${orgId}/…`. */
export type StorageBucket = "logs" | "media" | "documents" | "branding";

export interface StoragePort {
  createSignedUploadUrl(bucket: StorageBucket, path: string): Promise<{ url: string; token?: string }>;
  createSignedDownloadUrl(bucket: StorageBucket, path: string, expiresInSeconds?: number): Promise<string>;
  remove(bucket: StorageBucket, path: string): Promise<void>;
}

export interface JobQueuePort {
  /** Enqueue a detached background job (parsing, pack generation, …). */
  enqueue(jobName: string, payload: unknown): Promise<void>;
}

export interface SchedulerPort {
  /** Register a daily job (mapped to pg_cron in the Supabase adapter). */
  registerDaily(jobName: string, hourUtc: number): Promise<void>;
}

export interface SecretsPort {
  get(key: string): Promise<string | null>;
}

export type NotificationTrigger =
  | "document_expiry"
  | "low_currency"
  | "mission_overdue"
  | "inspection_overdue"
  | "part_replacement_overdue"
  | "night_flight";

export interface NotifierPort {
  notify(input: {
    userId: string;
    orgId: string;
    trigger: NotificationTrigger;
    title: string;
    body?: string;
  }): Promise<void>;
}

export interface Adapters {
  auth: AuthPort;
  storage: StoragePort;
  jobs: JobQueuePort;
  scheduler: SchedulerPort;
  secrets: SecretsPort;
  notifier: NotifierPort;
}

/**
 * Storage paths are org-scoped: the first segment must be the org id, so
 * Storage RLS (accessible_org_ids) can enforce tenant isolation on objects.
 */
export function orgScopedPath(orgId: string, ...segments: string[]): string {
  return [orgId, ...segments].join("/");
}

export function assertOrgScopedPath(orgId: string, path: string): void {
  if (!path.startsWith(`${orgId}/`)) {
    throw new Error(`storage path must be prefixed with the org id (${orgId}/…)`);
  }
}
