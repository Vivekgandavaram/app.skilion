import { z } from "zod";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";
import { checkPassword, hashPassword } from "@/lib/auth";
import { passwordRule } from "@/lib/schemas";

export const POST = route({ auth: true, rate: { key: "pw", limit: 10, windowSec: 3600 } }, async ({ req, user }) => {
  const d = await body(req, z.object({ current: z.string().optional(), next: passwordRule }));
  if (user.passwordHash) {
    if (!d.current || !(await checkPassword(d.current, user.passwordHash))) throw new HttpError(400, "Your current password is not right.");
  } else if (!user.emailVerified) throw new HttpError(403, "Verify your email first.");
  await (await col("users")).updateOne({ _id: user._id }, { $set: { passwordHash: await hashPassword(d.next), updatedAt: new Date() } });
  return { ok: true };
});
