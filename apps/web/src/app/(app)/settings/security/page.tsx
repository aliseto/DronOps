import { eq } from "drizzle-orm";
import { Card, PageHeader } from "@dronops/ui";
import { getAdminDb } from "@dronops/db/client";
import { authenticators } from "@dronops/db/schema";
import { getCurrentUser } from "@/lib/session";
import { PasskeyManager } from "./PasskeyManager";

export default async function SecurityPage() {
  const user = await getCurrentUser();
  let passkeys: Array<{ credentialId: string; label: string | null; createdAt: Date }> = [];
  if (user?.id && user.id !== "e2e-user") {
    passkeys = await getAdminDb()
      .select({
        credentialId: authenticators.credentialId,
        label: authenticators.label,
        createdAt: authenticators.createdAt,
      })
      .from(authenticators)
      .where(eq(authenticators.userId, user.id));
  }

  return (
    <>
      <PageHeader
        title="Security"
        description="Passkeys for signing consequential actions."
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Security" }]}
      />
      <div className="grid gap-4 p-6 md:grid-cols-2">
        <Card title="Passkeys">
          <PasskeyManager />
          {passkeys.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2">
              {passkeys.map((p) => (
                <li
                  key={p.credentialId}
                  className="flex items-center justify-between rounded-md border border-subtle bg-inset px-3 py-2 text-small"
                >
                  <span>{p.label ?? "Passkey"}</span>
                  <span className="font-mono text-micro text-fg-muted">
                    {p.credentialId.slice(0, 10)}…
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
