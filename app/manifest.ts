import type { MetadataRoute } from "next";
import { isDevDeployment } from "@/lib/env";

export default function manifest(): MetadataRoute.Manifest {
  const name = isDevDeployment ? "CURZ FIT (Dev)" : "CURZ FIT";
  const shortName = isDevDeployment ? "CURZ FIT Dev" : "CURZ FIT";

  return {
    name,
    short_name: shortName,
    description: "Fast, installable workout tracking web app.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    id: "/",
    background_color: "#1c1c1e",
    theme_color: "#f2f2f7",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
