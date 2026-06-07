import { Drawer } from "./Drawer";
import { Timeline, type TimelineEvent } from "../components/Timeline";
import { Skeleton } from "../components/Skeleton";

/**
 * Generic entity-history drawer: the audit trail for any record, rendered as a
 * Timeline. Data fetching is the host's concern (pass events).
 */
export function HistoryDrawer({
  open,
  onClose,
  title = "History",
  events,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  events: TimelineEvent[];
  loading?: boolean;
}) {
  return (
    <Drawer open={open} onClose={onClose} title={title}>
      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      ) : (
        <Timeline events={events} />
      )}
    </Drawer>
  );
}
