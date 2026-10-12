import { col, ObjectId } from "./db";
import { notifyEmail } from "./email";
import type { UserDoc } from "./types";

type Kind = "bond" | "message" | "invite" | "squad" | "system" | "project";
const PREF: Record<Kind, keyof UserDoc["notifyPrefs"] | null> = { bond: "bonds", message: "messages", invite: "squads", squad: "squads", project: "squads", system: null };

function inQuietHours(u: UserDoc) {
  const { quietStart, quietEnd } = u.notifyPrefs || {};
  if (quietStart === undefined || quietEnd === undefined || quietStart === quietEnd) return false;
  let h: number;
  try {
    h = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: u.timezone || "UTC" }).format(new Date())) % 24;
  } catch {
    h = new Date().getUTCHours();
  }
  return quietStart < quietEnd ? h >= quietStart && h < quietEnd : h >= quietStart || h < quietEnd;
}

/** In-app notification, plus an email when the person allows it. Never throws. */
export async function notify(userId: ObjectId, kind: Kind, title: string, body?: string, href?: string, opts: { email?: boolean; dedupeKey?: string } = {}) {
  try {
    const users = await col("users");
    const notes = await col("notifications");
    const u = (await users.findOne({ _id: userId })) as UserDoc | null;
    if (!u) return;
    const pref = PREF[kind];
    if (pref && u.notifyPrefs?.[pref] === false) return;
    if (opts.dedupeKey) {
      const dup = await notes.findOne({ userId, type: opts.dedupeKey, read: false });
      if (dup) return;
    }
    await notes.insertOne({ userId, type: opts.dedupeKey || kind, title, body, href, read: false, createdAt: new Date() } as any);
    if (opts.email !== false && u.notifyPrefs?.email && u.emailVerified && !inQuietHours(u)) await notifyEmail(u.email, title, body || title, href);
  } catch (e) {
    console.error("notify failed", e);
  }
}
