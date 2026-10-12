import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { col } from "@/lib/db";
import { selfView, ser } from "@/lib/serialize";

export const GET = route({ auth: true, rate: { key: "export", limit: 5, windowSec: 3600 } }, async ({ user }) => {
  const id = user._id;
  const q = async (c: string, f: object, lim = 5000) => ser(await (await col(c as any)).find(f as any).limit(lim).toArray());
  const data = {
    exportedAt: new Date().toISOString(),
    profile: selfView(user),
    works: await q("works", { userId: id }),
    posts: await q("posts", { authorId: id }),
    comments: await q("comments", { userId: id }),
    reactions: await q("reactions", { userId: id }),
    bonds: await q("bonds", { $or: [{ fromId: id }, { toId: id }] }),
    endorsementsGiven: await q("endorsements", { fromId: id }),
    endorsementsReceived: await q("endorsements", { toId: id }),
    messagesSent: await q("messages", { senderId: id }, 20000),
    blueprints: await q("blueprints", { ownerId: id }),
    carts: await q("carts", { ownerId: id }),
    projects: await q("projects", { "members.userId": id }),
    invitations: await q("invitations", { $or: [{ fromId: id }, { toId: id }] }),
    payments: await q("payments", { userId: id }),
    savedSearches: await q("savedSearches", { userId: id }),
  };
  return new NextResponse(JSON.stringify(data, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="skilion-export-${user.handle}.json"`, "Cache-Control": "no-store" } });
});
