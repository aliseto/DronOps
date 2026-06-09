import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getAdminDb } from "@dronops/db";
import { organizations } from "@dronops/db/schema";
import { getOccurrenceDetail } from "@/server/safety";
import { JURISDICTIONS } from "@dronops/content";
import { occurrenceReportMeta, type Jurisdiction } from "@dronops/shared";
import { OccurrenceReportDocument } from "./OccurrenceReportDocument";

export default async function OccurrenceReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const orgId = user?.id ? await getActiveOrgId(user.id) : null;
  if (!orgId) notFound();

  const detail = await getOccurrenceDetail(orgId, id);
  if (!detail) notFound();

  const authority = JURISDICTIONS[detail.jurisdiction as keyof typeof JURISDICTIONS]?.authority ?? detail.jurisdiction;
  const meta = occurrenceReportMeta(detail.jurisdiction as Jurisdiction, authority);

  let orgName: string | null = null;
  try {
    const [org] = await getAdminDb().select({ name: organizations.name }).from(organizations).where(eq(organizations.id, orgId)).limit(1);
    orgName = org?.name ?? null;
  } catch {
    // org name is cosmetic on the header
  }

  return <OccurrenceReportDocument detail={detail} meta={meta} orgName={orgName} />;
}
