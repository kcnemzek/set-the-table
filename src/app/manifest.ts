import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SetTheTable",
    short_name: "SetTheTable",
    description: "Dinner is set.",
    start_url: "/menu",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#162D5A",
    icons: [
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
