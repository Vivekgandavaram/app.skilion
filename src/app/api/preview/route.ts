import { z } from "zod";
import { route, body, bad } from "@/lib/api";
import { assertPublicUrl } from "@/lib/security";
import { buildPreview } from "@/lib/url-preview";

/** Link preview for the composer. Only metadata, never rehosted media. */
export const POST = route({ auth: true, rate: { key: "preview", limit: 60, windowSec: 3600 } }, async ({ req }) => {
  const { url } = await body(req, z.object({ url: z.string().trim().url().max(500) }));
  try { await assertPublicUrl(url); } catch { throw bad("That link cannot be previewed."); }
  return { preview: await buildPreview(url) };
});
