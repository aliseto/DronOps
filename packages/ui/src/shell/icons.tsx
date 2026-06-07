import type { SVGProps } from "react";

const I = (props: SVGProps<SVGSVGElement>) => ({
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export const DashboardIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...I(p)}>
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </svg>
);
export const DocumentsIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...I(p)}>
    <path d="M14 3v5h5" />
    <path d="M6 3h8l5 5v13H6z" />
    <path d="M9 13h6M9 17h6" />
  </svg>
);
export const ComplianceIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...I(p)}>
    <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
export const SafetyIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...I(p)}>
    <path d="M12 3l9 16H3z" />
    <path d="M12 10v4M12 16.5v.5" />
  </svg>
);
export const OperationsIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...I(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
  </svg>
);
export const FleetIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...I(p)}>
    <circle cx="12" cy="12" r="2" />
    <path d="M12 10V6M12 14v4M10 12H6M14 12h4" />
    <circle cx="5" cy="5" r="1.6" />
    <circle cx="19" cy="5" r="1.6" />
    <circle cx="5" cy="19" r="1.6" />
    <circle cx="19" cy="19" r="1.6" />
  </svg>
);
export const EvidenceIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...I(p)}>
    <path d="M3 17l5-6 4 4 4-7 5 9" />
    <path d="M3 21h18" />
  </svg>
);
export const PersonnelIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...I(p)}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <path d="M16 11a3 3 0 000-6M21 20c0-2.5-1.5-4.6-3.6-5.5" />
  </svg>
);
export const SettingsIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...I(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13a7.9 7.9 0 000-2l2-1.5-2-3.4-2.3 1a8 8 0 00-1.7-1l-.3-2.6h-4l-.3 2.6a8 8 0 00-1.7 1l-2.3-1-2 3.4L4.6 11a7.9 7.9 0 000 2l-2 1.5 2 3.4 2.3-1a8 8 0 001.7 1l.3 2.6h4l.3-2.6a8 8 0 001.7-1l2.3 1 2-3.4z" />
  </svg>
);
export const ChevronIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...I(p)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
