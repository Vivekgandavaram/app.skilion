import { route } from "@/lib/api";
import { col } from "@/lib/db";

export const GET = route({ auth: true }, async ({ user }) => {
  const [notes, convs, invites, bonds] = await Promise.all([col("notifications"), col("conversations"), col("invitations"), col("bonds")]);
  const [notifications, invitesN, bondsN, myConvs] = await Promise.all([
    notes.countDocuments({ userId: user._id, read: false }),
    invites.countDocuments({ toId: user._id, status: "pending" }),
    bonds.countDocuments({ toId: user._id, status: "requested" }),
    convs.find({ memberIds: user._id, "lastMessage.at": { $exists: true } }, { projection: { lastMessage: 1, reads: 1 } }).limit(200).toArray(),
  ]);
  const me = user._id.toString();
  const messages = myConvs.filter((c) => c.lastMessage && c.lastMessage.senderId.toString() !== me && (!c.reads?.[me] || new Date(c.reads[me]) < c.lastMessage.at)).length;
  return { notifications, messages, invites: invitesN, bonds: bondsN };
});
