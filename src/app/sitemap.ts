import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { col, dbConfigured } from "@/lib/db";

export const revalidate = 3600;
const STATIC = ["", "/how-it-works", "/for-founders", "/for-builders", "/pricing", "/about", "/resources", "/contact", "/explore", "/showcase", "/terms", "/privacy", "/cookies", "/guidelines", "/security", "/login", "/signup"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const out: MetadataRoute.Sitemap = STATIC.map((p) => ({ url: `${env.siteUrl}${p}`, changeFrequency: p === "" ? "weekly" : "monthly", priority: p === "" ? 1 : 0.6 }));
  if (!dbConfigured()) return out;
  try {
    const users = await col("users");
    const projects = await col("projects");
    const pubUsers = await users.find({ "visibility.public": true, onboarded: true, status: "active", isDemo: { $ne: true } }, { projection: { handle: 1, updatedAt: 1 } }).limit(5000).toArray();
    for (const u of pubUsers) out.push({ url: `${env.siteUrl}/u/${u.handle}`, lastModified: u.updatedAt, priority: 0.5 });
    const pubProjects = await projects.find({ "showcase.enabled": true }, { projection: { "showcase.slug": 1, updatedAt: 1 } }).limit(5000).toArray();
    for (const p of pubProjects) if (p.showcase?.slug) out.push({ url: `${env.siteUrl}/showcase/${p.showcase.slug}`, lastModified: p.updatedAt, priority: 0.5 });
  } catch {}
  return out;
}
