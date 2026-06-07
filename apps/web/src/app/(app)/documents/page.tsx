import { getTranslations } from "next-intl/server";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export default async function DocumentsPage() {
  const nav = await getTranslations("nav");
  const m = await getTranslations("modules.documents");
  return (
    <ModulePlaceholder
      title={nav("documents")}
      description={m("description")}
      milestone={m("milestone")}
    />
  );
}
