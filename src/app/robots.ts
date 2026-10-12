import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/settings", "/messages", "/team", "/projects", "/notifications", "/onboarding", "/build", "/invites", "/verify", "/reset"] }],
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
