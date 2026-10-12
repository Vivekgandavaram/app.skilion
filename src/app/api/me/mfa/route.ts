import { z } from "zod";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";
import { checkPassword } from "@/lib/auth";

export const POST = route({ auth: true, verified: true, rate: { key: "mfa-toggle", limit: 10, windowSec: 3600 } }, async ({ req, user }) => {
  const d = await body(req, z.object({ enable: z.boolean(), password: z.string().optional() }));
  if (!d.enable && user.passwordHash && !(d.password && (await checkPassword(d.password, user.passwordHash)))) throw new HttpError(400, "Enter your password to turn this off.");
  await (await col("users")).updateOne({ _id: user._id }, { $set: { mfa: { enabled: d.enable }, updatedAt: new Date() } });
  return { ok: true, enabled: d.enable };
});
