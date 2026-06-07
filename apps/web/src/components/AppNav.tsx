"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { AppShell, Button, ThemeToggle, type LinkComponent, type NavItem } from "@dronops/ui";
import { FOOTER_NAV, PRIMARY_NAV, type NavConfigItem } from "./nav-config";

const LinkAdapter: LinkComponent = ({ href, className, children, ...rest }) => (
  <Link href={href} className={className} {...rest}>
    {children}
  </Link>
);

export function AppNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const toItem = (c: NavConfigItem): NavItem => ({
    href: c.href,
    label: t(c.labelKey),
    icon: c.icon,
    active: pathname === c.href || pathname.startsWith(`${c.href}/`),
  });

  return (
    <AppShell
      items={PRIMARY_NAV.map(toItem)}
      footerItems={FOOTER_NAV.map(toItem)}
      brand="DronOps"
      linkComponent={LinkAdapter}
      topbar={
        <>
          <span className="text-small text-fg-muted">Aironov</span>
          <div className="ms-auto flex items-center gap-2">
            <ThemeToggle className="rounded-md border border-default bg-surface px-3 py-1.5 text-small text-fg-secondary hover:bg-hover" />
            <Button variant="ghost" size="sm" onClick={() => void signOut({ redirectTo: "/signin" })}>
              Sign out
            </Button>
          </div>
        </>
      }
    >
      {children}
    </AppShell>
  );
}
