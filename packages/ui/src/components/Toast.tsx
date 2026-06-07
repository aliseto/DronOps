"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

export type ToastTone = "success" | "error" | "info";
export interface Toast {
  id: string;
  tone: ToastTone;
  message: ReactNode;
  action?: { label: string; onClick: () => void };
}

interface ToastCtx {
  toast: (t: Omit<Toast, "id">) => void;
}
const Ctx = createContext<ToastCtx | null>(null);

/** Confirmation only for results not visible in place (UX §5). Errors persist
 * until dismissed; successes auto-dismiss at 4s. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = crypto.randomUUID();
      setToasts((ts) => [...ts, { ...t, id }]);
      if (t.tone !== "error") setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 end-4 z-[100] flex w-80 flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-2 rounded-md border bg-raised px-3 py-2 text-small shadow-[var(--shadow-raised)]",
              t.tone === "error"
                ? "border-status-danger-fg text-status-danger-fg"
                : t.tone === "success"
                  ? "border-status-ok-fg text-fg-primary"
                  : "border-default text-fg-primary",
            )}
          >
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick();
                  dismiss(t.id);
                }}
                className="font-medium text-accent"
              >
                {t.action.label}
              </button>
            )}
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
              className="text-fg-muted hover:text-fg-primary"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export type { ToastCtx };
