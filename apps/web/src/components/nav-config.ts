import { Icons } from "@dronops/ui";
import type { ComponentType } from "react";

export interface NavConfigItem {
  href: string;
  /** key under the "nav" i18n namespace */
  labelKey: string;
  icon: ComponentType<{ width?: number; height?: number }>;
}

export const PRIMARY_NAV: NavConfigItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: Icons.DashboardIcon },
  { href: "/documents", labelKey: "documents", icon: Icons.DocumentsIcon },
  { href: "/compliance", labelKey: "compliance", icon: Icons.ComplianceIcon },
  { href: "/safety", labelKey: "safety", icon: Icons.SafetyIcon },
  { href: "/operations", labelKey: "operations", icon: Icons.OperationsIcon },
  { href: "/fleet", labelKey: "fleet", icon: Icons.FleetIcon },
  { href: "/evidence", labelKey: "evidence", icon: Icons.EvidenceIcon },
  { href: "/personnel", labelKey: "personnel", icon: Icons.PersonnelIcon },
];

export const FOOTER_NAV: NavConfigItem[] = [
  { href: "/settings", labelKey: "settings", icon: Icons.SettingsIcon },
];
