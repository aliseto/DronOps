"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { ChevronIcon } from "./icons";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ width?: number; height?: number }>;
  active?: boolean;
}

/** Link renderer the host app supplies (e.g. Next's <Link>). */
export type LinkComponent = ComponentType<{
  href: string;
  className?: string;
  "aria-current"?: "page" | undefined;
  children: ReactNode;
}>;

const DefaultLink: LinkComponent = ({ href, className, children, ...rest }) => (
  <a href={href} className={className} {...rest}>
    {children}
  </a>
);

const RAIL_KEY = "dronops-rail-collapsed";

export interface AppShellProps {
  /** Primary modules (Dashboard + 7 modules). */
  items: NavItem[];
  /** Footer items (e.g. Settings). */
  footerItems?: NavItem[];
  brand?: ReactNode;
  topbar?: ReactNode;
  linkComponent?: LinkComponent;
  children: ReactNode;
}

export function AppShell({
  items,
  footerItems = [],
  brand,
  topbar,
  linkComponent,
  children,
}: AppShellProps) {
  const Link = linkComponent ?? DefaultLink;
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(RAIL_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(RAIL_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={item.active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-small transition-colors",
          item.active
            ? "bg-selected text-fg-primary"
            : "text-fg-secondary hover:bg-hover hover:text-fg-primary",
          collapsed && "justify-center px-0",
        )}
      >
        <span className={cn("shrink-0", item.active && "text-accent")}>
          <Icon width={18} height={18} />
        </span>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-app text-fg-primary">
      <nav
        aria-label="Primary"
        className={cn(
          "flex shrink-0 flex-col border-e border-subtle bg-surface transition-[width]",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex h-14 items-center gap-2 px-3">
          {!collapsed && <div className="truncate font-semibold">{brand}</div>}
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            className="ms-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-muted hover:bg-hover"
          >
            <ChevronIcon
              width={16}
              height={16}
              style={{ transform: collapsed ? "none" : "scaleX(-1)" }}
            />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">{items.map(renderItem)}</div>
        {footerItems.length > 0 && (
          <div className="flex flex-col gap-1 border-t border-subtle p-2">
            {footerItems.map(renderItem)}
          </div>
        )}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        {topbar && (
          <header className="flex h-14 items-center gap-3 border-b border-subtle bg-surface px-4">
            {topbar}
          </header>
        )}
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
