import { safeFetchText } from "./security";

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x27;/g, "'").trim();
function meta(html: string, names: string[]) {
  for (const n of names) {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${n}["'][^>]*>`, "i");
    const tag = html.match(re)?.[0];
    const c = tag?.match(/content=["']([^"']*)["']/i)?.[1];
    if (c) return decode(c);
  }
}

const KNOWN: [RegExp, string][] = [
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, "YouTube"], [/(^|\.)github\.com$/, "GitHub"], [/(^|\.)linkedin\.com$/, "LinkedIn"], [/(^|\.)x\.com$|(^|\.)twitter\.com$/, "X"],
  [/(^|\.)instagram\.com$/, "Instagram"], [/(^|\.)medium\.com$/, "Medium"], [/(^|\.)dev\.to$/, "DEV"], [/(^|\.)figma\.com$/, "Figma"], [/(^|\.)behance\.net$/, "Behance"],
  [/(^|\.)dribbble\.com$/, "Dribbble"], [/(^|\.)notion\.(so|site)$/, "Notion"], [/(^|\.)producthunt\.com$/, "Product Hunt"], [/(^|\.)reddit\.com$/, "Reddit"],
];
export function sourceName(host: string) {
  return KNOWN.find(([re]) => re.test(host))?.[1] || host.replace(/^www\./, "");
}

/** Permitted metadata only (title, description, thumbnail URL, creator). We never download or rehost media. */
export async function buildPreview(rawUrl: string) {
  const host = new URL(rawUrl).hostname;
  const fallback = { siteName: sourceName(host), title: host.replace(/^www\./, ""), finalUrl: rawUrl, fallback: true as boolean };
  try {
    const { html, url } = await safeFetchText(rawUrl);
    if (!html) return { ...fallback, finalUrl: url };
    const title = meta(html, ["og:title", "twitter:title"]) || decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
    const description = meta(html, ["og:description", "twitter:description", "description"]);
    let image = meta(html, ["og:image", "twitter:image"]);
    if (image) {
      try {
        const u = new URL(image, url);
        image = u.protocol === "https:" ? u.toString() : undefined; // only https thumbnails, hot-linked not stored
      } catch { image = undefined; }
    }
    const creator = meta(html, ["article:author", "author", "twitter:creator"]);
    const siteName = meta(html, ["og:site_name"]) || sourceName(new URL(url).hostname);
    if (!title && !description) return { ...fallback, finalUrl: url };
    return { title: title?.slice(0, 200) || fallback.title, description: description?.slice(0, 300), image, creator: creator?.slice(0, 80), siteName: siteName.slice(0, 60), finalUrl: url, fallback: false };
  } catch {
    return fallback;
  }
}
