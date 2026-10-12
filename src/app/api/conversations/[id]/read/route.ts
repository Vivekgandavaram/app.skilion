import { route } from "@/lib/api";
import { col } from "@/lib/db";
import { memberConv } from "@/lib/messaging";
export const POST = route<{ id: string }>({ auth: true }, async ({ user, params }) => {
  const c = await memberConv(params.id, user._id);
  const now = new Date();
  await (await col("conversations")).updateOne({ _id: c._id }, { $set: { [`reads.${user._id}`]: now } });
  await (await col("notifications")).updateMany({ userId: user._id, type: `msg-${c._id}`, read: false }, { $set: { read: true } });
  return { ok: true };
});
