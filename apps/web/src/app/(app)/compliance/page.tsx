import { getTranslations } from "next-intl/server";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export default async function CompliancePage() {
  const nav = await getTranslations("nav");
  const m = await getTranslations("modules.compliance");
  return (
    <ModulePlaceholder
      title={nav("compliance")}
      description={m("description")}
      milestone={m("milestone")}
    />
  );
}
