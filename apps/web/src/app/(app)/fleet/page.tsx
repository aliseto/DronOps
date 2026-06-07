import { getTranslations } from "next-intl/server";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export default async function FleetPage() {
  const nav = await getTranslations("nav");
  const m = await getTranslations("modules.fleet");
  return (
    <ModulePlaceholder
      title={nav("fleet")}
      description={m("description")}
      milestone={m("milestone")}
    />
  );
}
