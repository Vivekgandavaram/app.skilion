import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { col, oid, ObjectId } from "./db";
import { env } from "./env";
import type { UserDoc } from "./types";
import { verifyAccessToken } from "./mobile/tokens";

export const SESSION_COOKIE = "sk_session";
const MAX_AGE = 60 * 60 * 24 * 30;
const key = () => new TextEncoder().encode(env.authSecret);

export async function signSession(uid: string, ver = 0) {
  return new SignJWT({ uid, ver })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
}
export async function readSession(token?: string | null): Promise<{ uid: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return typeof payload.uid === "string" ? { uid: payload.uid } : null;
  } catch {
    return null;
  }
}
export async function setSession(userId: string) {
  const token = await signSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}
export async function clearSession() {
  (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, secure: env.isProd, sameSite: "lax", path: "/", maxAge: 0 });
}

/** The signed-in user (or null). Cached per request. Supports httpOnly cookie or Authorization: Bearer. */
export const getSessionUser = cache(async (): Promise<UserDoc | null> => {
  let uid: string | null = null;
  try {
    const h = await headers();
    const auth = h.get("authorization") || h.get("Authorization");
    if (auth && auth.toLowerCase().startsWith("bearer ")) {
      const token = auth.slice(7).trim();
      const v = await verifyAccessToken(token);
      if (v) uid = v.uid;
    }
  } catch {}
  if (!uid) {
    try {
      const token = (await cookies()).get(SESSION_COOKIE)?.value;
      const s = await readSession(token);
      uid = s?.uid || null;
    } catch {}
  }
  const id = uid && oid(uid);
  if (!id) return null;
  const users = await col("users");
  const u = (await users.findOne({ _id: id })) as UserDoc | null;
  if (!u || u.status === "suspended") return null;
  return u;
});

export const hashPassword = (p: string) => bcrypt.hash(p, 11);
export const checkPassword = (p: string, h: string) => bcrypt.compare(p, h);

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 30) || "builder";
}
export async function uniqueHandle(base: string) {
  const users = await col("users");
  const b = slugify(base);
  for (let i = 0; i < 8; i++) {
    const h = i === 0 ? b : `${b}-${Math.random().toString(36).slice(2, 6)}`;
    if (!(await users.findOne({ handle: h }, { projection: { _id: 1 } }))) return h;
  }
  return `${b}-${Date.now().toString(36)}`;
}

export function defaultUser(p: { email: string; name: string; handle: string; image?: string; emailVerified: boolean; passwordHash?: string; providers?: UserDoc["providers"]; timezone?: string }): Omit<UserDoc, "_id"> {
  const now = new Date();
  return {
    email: p.email.toLowerCase(),
    emailVerified: p.emailVerified,
    passwordHash: p.passwordHash,
    name: p.name,
    handle: p.handle,
    image: p.image,
    role: env.adminEmails.includes(p.email.toLowerCase()) ? "admin" : "user",
    status: "active",
    providers: p.providers || {},
    intents: [],
    onboarded: false,
    plan: { id: "free" },
    timezone: p.timezone || "Asia/Kolkata",
    skills: [],
    dayJob: false,
    goals: [],
    compensation: ["paid", "equity", "revshare", "learning"],
    availability: { status: "open", hoursPerWeek: 6, slots: [] },
    links: {},
    visibility: { public: false, showRate: true, showLocation: true, showAvailability: true, showLinks: true },
    verifications: p.emailVerified ? [{ type: "email", at: now }] : [],
    notifyPrefs: { email: true, bonds: true, messages: true, squads: true },
    usage: { aiMonth: "", aiCount: 0 },
    createdAt: now,
    updatedAt: now,
  };
}

/** Create or link an account from an OAuth identity. Safe against pre-hijacking. */
export async function upsertOAuthUser(provider: "google" | "github", p: { id: string; email: string; emailVerified: boolean; name: string; image?: string }) {
  const users = await col("users");
  const email = p.email.toLowerCase();
  let u = (await users.findOne({ [`providers.${provider}`]: p.id } as any)) as UserDoc | null;
  if (!u) {
    u = (await users.findOne({ email })) as UserDoc | null;
    if (u) {
      if (!p.emailVerified) throw new Error("Your provider did not verify this email address.");
      const set: Record<string, unknown> = { [`providers.${provider}`]: p.id, emailVerified: true, updatedAt: new Date() };
      // an unverified password account could have been created by someone else: drop that credential below
      const vs = u.verifications.some((v) => v.type === provider) ? u.verifications : [...u.verifications, { type: provider, at: new Date() }];
      await users.updateOne({ _id: u._id }, { $set: { ...set, verifications: vs, image: u.image || p.image }, ...(u.emailVerified ? {} : { $unset: { passwordHash: "" } }) } as any);
      u = (await users.findOne({ _id: u._id })) as UserDoc;
    } else {
      if (!p.emailVerified) throw new Error("Your provider did not verify this email address.");
      const doc = defaultUser({ email, name: p.name || email.split("@")[0], handle: await uniqueHandle(p.name || email.split("@")[0]), image: p.image, emailVerified: true, providers: { [provider]: p.id } });
      doc.verifications.push({ type: provider, at: new Date() });
      const r = await users.insertOne(doc as any);
      u = { ...(doc as any), _id: r.insertedId } as UserDoc;
    }
  }
  return u;
}

export function safeNext(n?: string | null) {
  return n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : "/discover";
}
export { ObjectId };

import { redirect } from "next/navigation";
/** For server pages that need a signed-in user. Redirects to /login. */
export async function requireUser(next = "/discover"): Promise<UserDoc> {
  const u = await getSessionUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  return u;
}
export async function requireRole(roles: Array<"admin" | "moderator">, next = "/admin"): Promise<UserDoc> {
  const u = await requireUser(next);
  if (!roles.includes(u.role as any)) redirect("/discover");
  return u;
}
