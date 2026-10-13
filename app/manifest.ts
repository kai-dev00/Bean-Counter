import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bean Counter",
    short_name: "Bean Counter",
    description: "Inventory, purchasing and supplier management",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#14213d",
    theme_color: "#14213d",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
