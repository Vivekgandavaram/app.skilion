import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "Skilion", short_name: "Skilion", description: "Teams built on proof of work", start_url: "/discover", display: "standalone", background_color: "#080B10", theme_color: "#080B10", icons: [{ src: "/brand/skilion-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }] };
}
