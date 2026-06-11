import type { MetadataRoute } from "next";

/** Installable PWA (PRD: PWA first). Branded raster icons are a pending asset
 * drop — the SVG mark below is the placeholder (flagged). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DronOps",
    short_name: "DronOps",
    description: "UAV operations and QMS compliance for licensed drone operators.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#101216",
    theme_color: "#101216",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
