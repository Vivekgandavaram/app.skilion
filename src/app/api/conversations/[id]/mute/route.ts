import { z } from "zod";
import { route, body } from "@/lib/api";
import { col } from "@/lib/db";
import { memberConv } from "@/lib/messaging";
export const POST = route<{ id: string }>({ auth: true }, async ({ req, user, params }) => {
  const { muted } = await body(req, z.object({ muted: z.boolean() }));
  const c = await memberConv(params.id, user._id);
  await (await col("conversations")).updateOne({ _id: c._id }, (muted ? { $addToSet: { mutedBy: user._id } } : { $pull: { mutedBy: user._id } }) as any);
  return { ok: true, muted };
});
