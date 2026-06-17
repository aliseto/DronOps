import { Button, PageHeader } from "@dronops/ui";
import { createTenantAndOrgAction } from "./actions";

const field = "rounded-md border border-default bg-inset px-3 py-2 text-body text-fg-primary focus-visible:border-focus";

export default function OnboardingPage() {
  return (
    <>
      <PageHeader
        title="Create your operation"
        description="A tenant owns your organisations; each organisation is bound to one regulator at creation."
      />
      <div className="p-6">
        <form action={createTenantAndOrgAction} className="flex max-w-md flex-col gap-4">
          <label className="flex flex-col gap-1 text-small text-fg-secondary">
            Tenant name
            <input name="tenantName" required placeholder="e.g. Aironov Group" className={field} />
          </label>
          <label className="flex flex-col gap-1 text-small text-fg-secondary">
            Organisation name
            <input name="orgName" required placeholder="e.g. Aironov UAE" className={field} />
          </label>
          <label className="flex flex-col gap-1 text-small text-fg-secondary">
            Jurisdiction / regulator
            <select name="regulatorCode" defaultValue="GCAA" className={field}>
              <option value="GCAA">UAE — GCAA (federal)</option>
              <option value="DCAA">UAE — DCAA (Dubai)</option>
              <option value="GACA">KSA — GACA</option>
              <option value="OMAN">Oman — Oman CAA</option>
            </select>
          </label>
          <div>
            <Button type="submit">Create tenant &amp; organisation</Button>
          </div>
        </form>
      </div>
    </>
  );
}
