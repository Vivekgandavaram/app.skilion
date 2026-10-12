import type { Metadata } from "next";
import { env } from "./env";

export const SITE = {
  name: "Skilion",
  tagline: "Build Extraordinary Teams, Together.",
  description: "Skilion helps people find collaborators by what they have built. Validate an idea, build a prototype, get help or start a company with a small team, in your spare time or full time.",
};

export function pageMeta(o: { title: string; description?: string; path?: string; image?: string; noindex?: boolean; type?: "website" | "profile" | "article" }): Metadata {
  const url = `${env.siteUrl}${o.path || ""}`;
  const description = o.description || SITE.description;
  const image = o.image || `${env.siteUrl}/og-default.png`;
  return {
    title: o.title,
    description,
    alternates: { canonical: url },
    robots: o.noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { title: o.title, description, url, siteName: SITE.name, type: o.type || "website", images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: o.title, description, images: [image] },
  };
}

export const jsonLd = (data: object) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
export const orgLd = () => ({
  "@context": "https://schema.org", "@type": "Organization", name: "Skilion by VIGO Tech", url: env.siteUrl, logo: `${env.siteUrl}/brand/skilion-mark.svg`, sameAs: ["https://vigotech.in", "https://github.com/Vivekgandavaram/skilion"],
});
