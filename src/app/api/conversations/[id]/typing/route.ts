import { route } from "@/lib/api";
import { col } from "@/lib/db";
import { memberConv } from "@/lib/messaging";
export const POST = route<{ id: string }>({ auth: true, rate: { key: "typing", limit: 120, windowSec: 60 } }, async ({ user, params }) => {
  const c = await memberConv(params.id, user._id);
  await (await col("typing")).updateOne({ convId: c._id, userId: user._id }, { $set: { at: new Date() } }, { upsert: true });
  return { ok: true };
});
