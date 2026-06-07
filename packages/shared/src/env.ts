import { z } from "zod";

/**
 * Server-side environment schema. Parsed lazily so that importing a package
 * that touches env doesn't blow up at module-eval time in contexts (tests,
 * client bundles) that don't need every var.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_DATABASE_URL: z.string().url(),
  ADMIN_DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().optional(),
  AUTH_WEBAUTHN_RP_ID: z.string().default("localhost"),
  AUTH_WEBAUTHN_RP_NAME: z.string().default("DronOps"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/** Validate and return server env. Throws a readable error if misconfigured. */
export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid server environment:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
