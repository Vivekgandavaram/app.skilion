import { route, notFound } from "@/lib/api";
import { oid } from "@/lib/db";
import { bondStateBetween } from "@/lib/relations";

export const GET = route<{ userId: string }>({ auth: true }, async ({ user, params }) => {
  const other = oid(params.userId); if (!other) throw notFound();
  return await bondStateBetween(user._id, other);
});
