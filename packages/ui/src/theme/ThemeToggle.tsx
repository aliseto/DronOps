"use client";

import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY, type Theme } from "./theme-script";

const readTheme = (): Theme => {
  if (typeof document === "undefined") return "dark";
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "print" ? t : "dark";
};

/**
 * Minimal dark/light switch. Writes data-theme on <html> and persists the
 * choice; the pre-hydration script restores it on next load.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={className}
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
