import { getTranslations } from "next-intl/server";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export default async function PersonnelPage() {
  const nav = await getTranslations("nav");
  const m = await getTranslations("modules.personnel");
  return (
    <ModulePlaceholder
      title={nav("personnel")}
      description={m("description")}
      milestone={m("milestone")}
    />
  );
}
