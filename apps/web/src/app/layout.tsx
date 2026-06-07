import type { ReactNode } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { dirFor, type Locale } from "@/i18n/config";
import "./globals.css";

export const metadata: Metadata = {
  title: "DronOps",
  description: "UAV operations and QMS compliance for licensed drone operators.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();

  // Dark is the default theme; light/print are opt-in (see DESIGN_SYSTEM §2).
  return (
    <html lang={locale} dir={dirFor(locale)} data-theme="dark">
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
