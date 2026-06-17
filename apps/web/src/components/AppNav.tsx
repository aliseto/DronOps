"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppShell, ThemeToggle, type LinkComponent, type NavItem } from "@dronops/ui";
import { CrewIcon, DashboardIcon, FleetIcon, MembersIcon, SettingsIcon } from "./nav-icons";
import { SignOutButton } from "./SignOutButton";

const LinkAdapter: LinkComponent = ({ href, className, children, ...rest }) => (
  <Link href={href} className={className} {...rest}>
    {children}
  </Link>
);

type NavDef = { href: string; label: string; icon: ComponentType<{ width?: number; height?: number }> };

const NAV: NavDef[] = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/fleet", label: "Fleet", icon: FleetIcon },
  { href: "/personnel", label: "Personnel", icon: CrewIcon },
  { href: "/members", label: "Members", icon: MembersIcon },
];
const FOOTER: NavDef[] = [{ href: "/settings", label: "Settings", icon: SettingsIcon }];

export function AppNav({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const toItem = (c: NavDef): NavItem => ({
    ...c,
    active: c.href === "/" ? pathname === "/" : pathname.startsWith(c.href),
  });
  return (
    <AppShell
      items={NAV.map(toItem)}
      footerItems={FOOTER.map(toItem)}
      brand="DOM"
      linkComponent={LinkAdapter}
      topbar={
        <>
          <span className="text-small text-fg-muted">{email}</span>
          <div className="ms-auto flex items-center gap-2">
            <ThemeToggle className="rounded-md border border-default bg-surface px-3 py-1.5 text-small text-fg-secondary hover:bg-hover" />
            <SignOutButton />
          </div>
        </>
      }
    >
      {children}
    </AppShell>
  );
}
