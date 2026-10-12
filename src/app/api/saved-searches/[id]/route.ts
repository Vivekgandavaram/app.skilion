import { route, notFound } from "@/lib/api";
import { col, oid } from "@/lib/db";
export const DELETE = route<{ id: string }>({ auth: true }, async ({ user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  await (await col("savedSearches")).deleteOne({ _id: id, userId: user._id });
  return { ok: true };
});
