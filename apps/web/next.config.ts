import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Source-only workspace packages are transpiled by Next rather than prebuilt.
  transpilePackages: ["@dronops/ui", "@dronops/db", "@dronops/shared", "@dronops/content"],
};

export default withNextIntl(nextConfig);
