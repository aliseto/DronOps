import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-app p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-title font-semibold text-fg-primary">DronOps</div>
          <div className="text-small text-fg-muted">by Aironov</div>
        </div>
        {children}
      </div>
    </div>
  );
}
