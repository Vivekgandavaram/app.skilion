import { route } from "@/lib/api";
import { col } from "@/lib/db";
export const POST = route({ auth: true }, async ({ user }) => {
  await (await col("notifications")).updateMany({ userId: user._id, read: false }, { $set: { read: true } });
  return { ok: true };
});
