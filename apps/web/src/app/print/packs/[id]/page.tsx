import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getAdminDb } from "@dronops/db";
import { organizations } from "@dronops/db/schema";
import { eq } from "drizzle-orm";
import { getAuditPackDetail } from "@/server/audit-pack";
import { PackDocument } from "./PackDocument";

export default async function PackPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const orgId = user?.id ? await getActiveOrgId(user.id) : null;
  if (!orgId) notFound();

  const detail = await getAuditPackDetail(orgId, id);
  if (!detail) notFound();

  let orgName: string | null = null;
  try {
    const [org] = await getAdminDb().select({ name: organizations.name }).from(organizations).where(eq(organizations.id, orgId)).limit(1);
    orgName = org?.name ?? null;
  } catch {
    // org name is cosmetic on the cover
  }

  return <PackDocument detail={detail} orgName={orgName} />;
}
