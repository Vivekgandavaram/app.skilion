import { MongoClient, type Db, type Collection, type Document, ObjectId } from "mongodb";
import type * as T from "./types";

declare global {
  // eslint-disable-next-line no-var
  var _mongo: { client?: Promise<MongoClient>; indexed?: boolean } | undefined;
}
const g = (globalThis._mongo ??= {});

export function dbConfigured() {
  return !!process.env.MONGODB_URI;
}

async function client() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  g.client ??= new MongoClient(process.env.MONGODB_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 }).connect();
  return g.client;
}

export async function getDb(): Promise<Db> {
  const c = await client();
  const db = c.db(process.env.MONGODB_DB || "skilion");
  if (!g.indexed) {
    g.indexed = true;
    ensureIndexes(db).catch((e) => {
      g.indexed = false;
      console.error("index error", e);
    });
  }
  return db;
}

export type Collections = {
  users: T.UserDoc;
  works: T.WorkDoc;
  posts: T.PostDoc;
  reactions: { _id: ObjectId; postId: ObjectId; userId: ObjectId; kind: "like" | "save"; createdAt: Date };
  comments: { _id: ObjectId; postId: ObjectId; userId: ObjectId; text: string; createdAt: Date };
  bonds: T.BondDoc;
  blocks: { _id: ObjectId; blockerId: ObjectId; blockedId: ObjectId; createdAt: Date };
  conversations: T.ConversationDoc;
  messages: T.MessageDoc;
  typing: { _id: ObjectId; convId: ObjectId; userId: ObjectId; at: Date };
  notifications: T.NotificationDoc;
  blueprints: T.BlueprintDoc;
  carts: T.CartDoc;
  invitations: T.InvitationDoc;
  projects: T.ProjectDoc;
  milestones: T.MilestoneDoc;
  tasks: T.TaskDoc;
  checkins: T.CheckinDoc;
  decisions: T.DecisionDoc;
  activity: T.ActivityDoc;
  reports: T.ReportDoc;
  payments: T.PaymentDoc;
  endorsements: { _id: ObjectId; fromId: ObjectId; toId: ObjectId; skill: string; text: string; createdAt: Date };
  savedSearches: { _id: ObjectId; userId: ObjectId; name: string; params: Record<string, string>; createdAt: Date };
  otps: { _id: ObjectId; email: string; purpose: "verify" | "reset" | "mfa"; codeHash: string; expiresAt: Date; attempts: number; createdAt: Date };
  rateLimits: { _id: string; count: number; resetAt: Date };
  audit: { _id: ObjectId; actorId?: ObjectId; action: string; target?: string; meta?: Record<string, unknown>; createdAt: Date };
  contacts: { _id: ObjectId; name: string; email: string; topic: string; message: string; createdAt: Date };
  settings: { _id: string; value: unknown };
  verificationRequests: { _id: ObjectId; userId: ObjectId; type: "identity" | "repo"; evidence: string; status: "pending" | "approved" | "rejected"; note?: string; decidedBy?: ObjectId; createdAt: Date; decidedAt?: Date };
  appeals: { _id: ObjectId; userId?: ObjectId; email: string; message: string; status: "open" | "closed"; createdAt: Date };
  devices: T.DeviceDoc;
};

export async function col<K extends keyof Collections>(name: K): Promise<Collection<Collections[K] & Document>> {
  const db = await getDb();
  return db.collection(name as string) as unknown as Collection<Collections[K] & Document>;
}

async function ensureIndexes(db: Db) {
  const c = (n: string) => db.collection(n);
  await Promise.all([
    c("users").createIndex({ email: 1 }, { unique: true }),
    c("users").createIndex({ handle: 1 }, { unique: true }),
    c("users").createIndex({ "providers.google": 1 }, { sparse: true }),
    c("users").createIndex({ "providers.github": 1 }, { sparse: true }),
    c("users").createIndex(
      { name: "text", headline: "text", bio: "text", "skills.name": "text", domain: "text" },
      { weights: { "skills.name": 8, headline: 5, name: 4, domain: 3, bio: 1 }, name: "user_text" },
    ),
    c("users").createIndex({ "visibility.public": 1, onboarded: 1, status: 1 }),
    c("works").createIndex({ userId: 1, createdAt: -1 }),
    c("posts").createIndex({ createdAt: -1 }),
    c("posts").createIndex({ text: "text", tags: "text" }, { name: "post_text" }),
    c("posts").createIndex({ authorId: 1, createdAt: -1 }),
    c("posts").createIndex({ type: 1, createdAt: -1 }),
    c("posts").createIndex({ url: 1, authorId: 1 }),
    c("reactions").createIndex({ postId: 1, userId: 1, kind: 1 }, { unique: true }),
    c("reactions").createIndex({ userId: 1, kind: 1, createdAt: -1 }),
    c("comments").createIndex({ postId: 1, createdAt: 1 }),
    c("bonds").createIndex({ pair: 1 }, { unique: true }),
    c("bonds").createIndex({ toId: 1, status: 1 }),
    c("bonds").createIndex({ fromId: 1, status: 1 }),
    c("blocks").createIndex({ blockerId: 1, blockedId: 1 }, { unique: true }),
    c("conversations").createIndex({ memberIds: 1, "lastMessage.at": -1 }),
    c("conversations").createIndex({ pairKey: 1 }, { unique: true, sparse: true }),
    c("conversations").createIndex({ projectId: 1 }, { sparse: true }),
    c("messages").createIndex({ convId: 1, _id: -1 }),
    c("typing").createIndex({ at: 1 }, { expireAfterSeconds: 15 }),
    c("typing").createIndex({ convId: 1, userId: 1 }, { unique: true }),
    c("notifications").createIndex({ userId: 1, createdAt: -1 }),
    c("notifications").createIndex({ userId: 1, read: 1 }),
    c("blueprints").createIndex({ ownerId: 1, createdAt: -1 }),
    c("carts").createIndex({ ownerId: 1, updatedAt: -1 }),
    c("carts").createIndex({ advisorToken: 1 }, { sparse: true }),
    c("invitations").createIndex({ toId: 1, status: 1 }),
    c("invitations").createIndex({ projectId: 1, toId: 1, status: 1 }),
    c("projects").createIndex({ ownerId: 1, updatedAt: -1 }),
    c("projects").createIndex({ "members.userId": 1 }),
    c("projects").createIndex({ "showcase.slug": 1 }, { unique: true, sparse: true }),
    c("projects").createIndex({ status: 1, "showcase.enabled": 1 }),
    c("tasks").createIndex({ projectId: 1, status: 1 }),
    c("milestones").createIndex({ projectId: 1 }),
    c("checkins").createIndex({ projectId: 1, createdAt: -1 }),
    c("decisions").createIndex({ projectId: 1, createdAt: -1 }),
    c("activity").createIndex({ projectId: 1, createdAt: -1 }),
    c("reports").createIndex({ status: 1, severity: 1, createdAt: -1 }),
    c("payments").createIndex({ orderId: 1 }, { unique: true }),
    c("payments").createIndex({ userId: 1, createdAt: -1 }),
    c("endorsements").createIndex({ toId: 1, fromId: 1, skill: 1 }, { unique: true }),
    c("savedSearches").createIndex({ userId: 1 }),
    c("otps").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    c("otps").createIndex({ email: 1, purpose: 1 }),
    c("rateLimits").createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 }),
    c("audit").createIndex({ createdAt: -1 }),
    c("verificationRequests").createIndex({ status: 1, createdAt: -1 }),
    c("appeals").createIndex({ status: 1, createdAt: -1 }),
    c("devices").createIndex({ userId: 1, lastSeenAt: -1 }),
    c("devices").createIndex({ deviceId: 1 }, { unique: true }),
    c("devices").createIndex({ refreshHash: 1 }, { unique: true }),
    c("devices").createIndex({ refreshExpiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}

export const oid = (v: unknown): ObjectId | null => {
  try {
    if (v instanceof ObjectId) return v;
    if (typeof v === "string" && /^[a-f0-9]{24}$/i.test(v)) return new ObjectId(v);
  } catch {}
  return null;
};
export { ObjectId };
