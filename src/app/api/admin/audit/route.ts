import { route } from "@/lib/api";
import { col } from "@/lib/db";
import { ser } from "@/lib/serialize";
export const GET = route({ auth: "admin" }, async () => {
  const rows = await (await col("audit")).find({}).sort({ createdAt: -1 }).limit(150).toArray();
  const us = await (await col("users")).find({ _id: { $in: rows.map((r) => r.actorId).filter(Boolean) as any[] } }, { projection: { name: 1, email: 1 } }).toArray();
  return { items: rows.map((r) => ({ ...ser(r), actor: us.find((u) => r.actorId && u._id.equals(r.actorId))?.name || "system" })) };
});
