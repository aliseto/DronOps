import { getTranslations } from "next-intl/server";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export default async function SafetyPage() {
  const nav = await getTranslations("nav");
  const m = await getTranslations("modules.safety");
  return (
    <ModulePlaceholder
      title={nav("safety")}
      description={m("description")}
      milestone={m("milestone")}
    />
  );
}
