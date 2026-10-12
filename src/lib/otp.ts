import crypto from "node:crypto";
import { col } from "./db";
import { env } from "./env";

const TTL_MIN = 10;
const MAX_ATTEMPTS = 5;
const hash = (email: string, purpose: string, code: string) =>
  crypto.createHmac("sha256", env.authSecret).update(`${email}|${purpose}|${code}`).digest("hex");

export async function issueOtp(email: string, purpose: "verify" | "reset" | "mfa") {
  const c = await col("otps");
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  await c.deleteMany({ email, purpose });
  await c.insertOne({ email, purpose, codeHash: hash(email, purpose, code), expiresAt: new Date(Date.now() + TTL_MIN * 60_000), attempts: 0, createdAt: new Date() } as any);
  return code;
}

export async function checkOtp(email: string, purpose: "verify" | "reset" | "mfa", code: string): Promise<"ok" | "invalid" | "expired" | "locked"> {
  const c = await col("otps");
  const d = await c.findOne({ email, purpose });
  if (!d || d.expiresAt < new Date()) return "expired";
  if (d.attempts >= MAX_ATTEMPTS) return "locked";
  const good = crypto.timingSafeEqual(Buffer.from(d.codeHash), Buffer.from(hash(email, purpose, code.trim())));
  if (!good) {
    await c.updateOne({ _id: d._id }, { $inc: { attempts: 1 } });
    return "invalid";
  }
  await c.deleteOne({ _id: d._id });
  return "ok";
}
