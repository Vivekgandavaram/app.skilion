import { z } from "zod";
import { handleRule } from "@/lib/schemas";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";


const RESERVED = new Set(["admin", "api", "login", "signup", "settings", "support", "skilion", "me", "u", "explore", "discover", "build", "team", "messages", "projects", "network", "pricing", "about", "contact", "security", "terms", "privacy", "showcase"]);

export const POST = route({ auth: true, rate: { key: "handle", limit: 10, windowSec: 3600 } }, async ({ req, user }) => {
  const { handle } = await body(req, z.object({ handle: handleRule }));
  if (RESERVED.has(handle)) throw new HttpError(400, "That handle is reserved.");
  const users = await col("users");
  if (await users.findOne({ handle, _id: { $ne: user._id } }, { projection: { _id: 1 } })) throw new HttpError(409, "That handle is taken.");
  await users.updateOne({ _id: user._id }, { $set: { handle, updatedAt: new Date() } });
  return { ok: true, handle };
});
