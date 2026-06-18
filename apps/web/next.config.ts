import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @dronops/ui and the @dom/* packages are consumed as TypeScript source.
  transpilePackages: ["@dronops/ui", "@dom/core", "@dom/adapters", "@dom/db", "@dom/parsers"],
  experimental: {
    // server actions / RLS bridge run on the Node runtime
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
