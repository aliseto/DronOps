import { getTranslations } from "next-intl/server";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export default async function OperationsPage() {
  const nav = await getTranslations("nav");
  const m = await getTranslations("modules.operations");
  return (
    <ModulePlaceholder
      title={nav("operations")}
      description={m("description")}
      milestone={m("milestone")}
    />
  );
}
