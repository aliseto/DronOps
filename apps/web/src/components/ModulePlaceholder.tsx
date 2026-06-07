import { PageHeader } from "@dronops/ui";

/** Consistent placeholder for modules whose features land in later milestones. */
export function ModulePlaceholder({
  title,
  description,
  milestone,
}: {
  title: string;
  description: string;
  milestone: string;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="p-6">
        <div className="rounded-lg border border-dashed border-default bg-surface p-8 text-center">
          <p className="text-body text-fg-secondary">This module is part of {milestone}.</p>
          <p className="mt-1 text-small text-fg-muted">
            The Phase 0 foundation establishes navigation, theming, the data spine and auth.
          </p>
        </div>
      </div>
    </>
  );
}
