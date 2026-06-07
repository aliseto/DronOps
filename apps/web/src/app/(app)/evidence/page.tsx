import { getTranslations } from "next-intl/server";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export default async function EvidencePage() {
  const nav = await getTranslations("nav");
  const m = await getTranslations("modules.evidence");
  return (
    <ModulePlaceholder
      title={nav("evidence")}
      description={m("description")}
      milestone={m("milestone")}
    />
  );
}
