import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mom, What's for Dinner?",
    short_name: "What's for Dinner",
    description: "Simple meal planning for the week ahead",
    start_url: "/menu",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0055b2",
    icons: [
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
