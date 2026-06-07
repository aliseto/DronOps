export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Right-to-left locales — drives <html dir>. */
export const rtlLocales: ReadonlySet<Locale> = new Set<Locale>(["ar"]);

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

export const dirFor = (locale: Locale): "rtl" | "ltr" =>
  rtlLocales.has(locale) ? "rtl" : "ltr";

/** Cookie used to persist the active locale (no URL prefix). */
export const LOCALE_COOKIE = "NEXT_LOCALE";
