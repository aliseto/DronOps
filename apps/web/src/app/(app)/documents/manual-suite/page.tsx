import { PARAM_GROUPS } from "@dronops/content";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getTemplateParams, previewManualSuite } from "@/server/manual-suite";
import { listPersons } from "@/server/distributions";
import { ManualSuiteWizard } from "./ManualSuiteWizard";

export default async function ManualSuitePage() {
  const user = await getCurrentUser();
  const orgId = user?.id ? await getActiveOrgId(user.id) : null;

  const params = orgId ? await getTemplateParams(orgId) : {};
  const preview = orgId ? await previewManualSuite(orgId) : { docs: [], allResolved: false };
  const persons = orgId ? await listPersons(orgId) : [];

  return (
    <ManualSuiteWizard groups={PARAM_GROUPS} params={params} persons={persons} preview={preview} />
  );
}
