// Public surface of @dronops/ui.

// Theme
export { ThemeToggle } from "./theme/ThemeToggle";
export { themeInitScript, THEME_STORAGE_KEY, type Theme } from "./theme/theme-script";

// Primitives
export { Button, type ButtonProps, type ButtonVariant } from "./components/Button";
export { IconButton, type IconButtonProps } from "./components/IconButton";
export { Input, Textarea, type InputProps, type TextareaProps } from "./components/Input";
export { Card, type CardProps } from "./components/Card";
export { Badge, type BadgeTone } from "./components/Badge";
export { JurisdictionBadge } from "./components/JurisdictionBadge";
export {
  StatusPill,
  type StatusDomain,
  type StatusVocab,
  type StatusTone,
} from "./components/StatusPill";
export { FormField } from "./components/FormField";
export { Skeleton } from "./components/Skeleton";
export { EmptyState, type EmptyVariant } from "./components/EmptyState";
export { Tooltip } from "./components/Tooltip";
export { Tabs, type TabItem } from "./components/Tabs";
export { Checkbox, Radio, Switch } from "./components/controls";
export { Select, type SelectOption, type SelectProps } from "./components/Select";
export { Combobox, type ComboItem } from "./components/Combobox";
export { DateField, type DateFieldProps } from "./components/DateField";
export { ToastProvider, useToast, type Toast, type ToastTone } from "./components/Toast";

export { Timeline, type TimelineEvent } from "./components/Timeline";
export { FileDrop, type UploadResult } from "./components/FileDrop";
export { SignatureBlock } from "./components/SignatureBlock";
export {
  SignatureCeremony,
  type SignatureResult,
  type SignProof,
} from "./components/SignatureCeremony";

// Overlays
export { Drawer } from "./overlays/Drawer";
export { Modal } from "./overlays/Modal";
export { HistoryDrawer } from "./overlays/HistoryDrawer";

// Data
export { DataTable, type Column, type DataTableProps } from "./data/DataTable";

// Forms
export { FormRenderer } from "./forms/FormRenderer";

// Shell
export { AppShell, type AppShellProps, type NavItem, type LinkComponent } from "./shell/AppShell";
export { PageHeader, type Crumb } from "./shell/PageHeader";
export * as Icons from "./shell/icons";

// Utilities
export { cn } from "./lib/cn";
