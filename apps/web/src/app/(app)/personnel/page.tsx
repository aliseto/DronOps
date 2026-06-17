import { PageHeader } from "@dronops/ui";
import { getActiveContext } from "@/server/context";
import { listPersonnel, personDetail } from "@/server/personnel";
import { PersonnelView } from "./PersonnelView";

export default async function PersonnelPage({
  searchParams,
}: {
  searchParams: Promise<{ person?: string }>;
}) {
  const ctx = await getActiveContext();
  const personId = (await searchParams).person;
  const roster = await listPersonnel(ctx);
  const detail = personId ? await personDetail(ctx, personId) : null;
  return (
    <>
      <PageHeader
        title="Personnel & crew"
        description="People and the credentials, currency and approvals the compliance engine checks."
      />
      <div className="p-6">
        <PersonnelView roster={roster} detail={detail && detail.person ? detail : null} />
      </div>
    </>
  );
}
