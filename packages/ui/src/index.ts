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
export {
  StatusPill,
  type StatusDomain,
  type StatusVocab,
  type StatusTone,
} from "./components/StatusPill";

// Shell
export { AppShell, type AppShellProps, type NavItem, type LinkComponent } from "./shell/AppShell";
export { PageHeader, type Crumb } from "./shell/PageHeader";
export * as Icons from "./shell/icons";

// Utilities
export { cn } from "./lib/cn";
