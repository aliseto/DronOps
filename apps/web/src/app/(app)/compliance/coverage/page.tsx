import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId, getPersonRoles } from "@/server/rbac";
import { getCoverageMatrix } from "@/server/compliance";
import { listDocuments } from "@/server/documents";
import { ComplianceTabs } from "../ComplianceTabs";
import { CoverageView } from "./CoverageView";

export default async function CoveragePage({
  searchParams,
}: {
  searchParams: Promise<{ req?: string }>;
}) {
  const user = await getCurrentUser();
  const selectedRef = (await searchParams).req ?? null;

  let matrix: Awaited<ReturnType<typeof getCoverageMatrix>> = { totals: { total: 0, covered: 0, partial: 0, gap: 0, na: 0, pct: null }, frameworks: [], rows: [] };
  let documents: { id: string; label: string }[] = [];
  let canAssess = false;
  try {
    const orgId = user?.id ? await getActiveOrgId(user.id) : null;
    if (orgId) {
      matrix = await getCoverageMatrix(orgId);
      documents = (await listDocuments(orgId)).map((d) => ({ id: d.id, label: `${d.docNo} · ${d.title}` }));
      const personId = user?.id ? await getCurrentPersonId(orgId, user.id) : null;
      const roles = personId ? await getPersonRoles(orgId, personId) : [];
      canAssess = roles.includes("quality_manager") || roles.includes("accountable_manager");
    }
  } catch {
    // degrade
  }

  return (
    <div className="flex flex-col gap-4">
      <ComplianceTabs active="coverage" />
      <CoverageView matrix={matrix} documents={documents} canAssess={canAssess} selectedRef={selectedRef} />
    </div>
  );
}
