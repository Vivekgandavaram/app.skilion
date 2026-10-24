import crypto from "node:crypto";
import { route, body, HttpError } from "@/lib/api";
import { checkRate } from "@/lib/security";
import { z } from "zod";

const Schema = z.object({
  file: z.string().min(1), // data URL or base64
  type: z.enum(["image", "video"]).default("image"),
  name: z.string().max(200).optional(),
});

const ALLOWED_IMG = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const ALLOWED_VID = ["video/mp4", "video/webm", "video/quicktime"];

function cloudinaryConfig() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) throw new HttpError(503, "Uploads are not configured.", "setup_required");
  return { cloud, key, secret };
}

function sign(params: Record<string, string>, secret: string) {
  const sorted = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  return crypto.createHash("sha1").update(sorted + secret).digest("hex");
}

export const POST = route({ auth: true, verified: true, rate: { key: "upload", limit: 20, windowSec: 3600 } }, async ({ req, user }) => {
  const d = await body(req, Schema);
  const { cloud, key, secret } = cloudinaryConfig();
  
  // Parse data URL
  let data: string;
  let mime = "image/jpeg";
  if (d.file.startsWith("data:")) {
    const m = d.file.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) throw bad("Invalid file data");
    mime = m[1];
    data = m[2];
  } else {
    // assume base64
    data = d.file;
  }
  
  if (d.type === "image") {
    if (!ALLOWED_IMG.includes(mime)) throw new HttpError(400, "Unsupported image type.");
  } else {
    if (!ALLOWED_VID.includes(mime)) throw new HttpError(400, "Unsupported video type.");
  }
  
  // Check size roughly
  const sizeBytes = (data.length * 3) / 4;
  if (d.type === "image" && sizeBytes > 10 * 1024 * 1024) throw new HttpError(400, "Image too large (max 10MB).");
  if (d.type === "video" && sizeBytes > 25 * 1024 * 1024) throw new HttpError(400, "Video too large (max 25MB).");
  
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = `skilion/${d.type}s`;
  const public_id = `${user._id.toString()}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  const params: Record<string, string> = {
    timestamp,
    folder,
    public_id,
  };
  const signature = sign(params, secret);
  
  const form = new FormData();
  form.append("file", `data:${mime};base64,${data}`);
  form.append("api_key", key);
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  form.append("public_id", public_id);
  form.append("signature", signature);
  
  const resourceType = d.type === "video" ? "video" : "image";
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${resourceType}/upload`, {
    method: "POST",
    body: form,
  });
  
  if (!res.ok) {
    const err = await res.text();
    console.error("cloudinary upload failed", err);
    throw new HttpError(500, "Upload failed.");
  }
  
  const json = await res.json() as any;
  return {
    url: json.secure_url,
    publicId: json.public_id,
    width: json.width,
    height: json.height,
    format: json.format,
    duration: json.duration,
  };
});
