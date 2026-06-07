import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface DateFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Timezone label shown alongside (audit-relevant times show their tz). */
  tzLabel?: string;
  withTime?: boolean;
}

/**
 * Date / datetime input. Values are UTC-backed at the data layer; the tz label
 * makes the displayed zone explicit on audit-relevant fields (DESIGN_SYSTEM,
 * UX §4). Minimal wrapper over the native control for now.
 */
export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(function DateField(
  { tzLabel, withTime, className, ...props },
  ref,
) {
  return (
    <div className="flex items-center gap-2">
      <input
        ref={ref}
        type={withTime ? "datetime-local" : "date"}
        className={cn(
          "rounded-md border border-default bg-inset px-3 py-2 font-mono text-mono text-fg-primary tabular-nums focus-visible:border-focus",
          className,
        )}
        {...props}
      />
      {tzLabel && <span className="text-micro text-fg-muted">{tzLabel}</span>}
    </div>
  );
});
