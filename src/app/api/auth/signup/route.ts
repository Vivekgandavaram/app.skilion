import { z } from "zod";
import { passwordRule } from "@/lib/schemas";
import { route, body, bad, HttpError } from "@/lib/api";
import { col } from "@/lib/db";
import { defaultUser, hashPassword, uniqueHandle } from "@/lib/auth";
import { issueOtp } from "@/lib/otp";
import { otpEmail } from "@/lib/email";
import { getFlags } from "@/lib/flags";


const Schema = z.object({ name: z.string().trim().min(2, "Enter your name").max(80), email: z.string().trim().toLowerCase().email("Enter a valid email").max(160), password: passwordRule });

export const POST = route({ rate: { key: "signup", limit: 10, windowSec: 3600 } }, async ({ req }) => {
  if (!(await getFlags()).signupsOpen) throw new HttpError(403, "Sign-ups are paused right now. Please try again later.");
  const d = await body(req, Schema);
  const users = await col("users");
  const existing = await users.findOne({ email: d.email });
  if (existing?.emailVerified) throw new HttpError(409, "An account with this email already exists. Log in, or reset your password.", "exists");
  if (!existing) {
    const doc = defaultUser({ email: d.email, name: d.name, handle: await uniqueHandle(d.name), emailVerified: false, passwordHash: await hashPassword(d.password), timezone: undefined });
    try { await users.insertOne(doc as any); } catch { throw bad("Could not create the account. Please try again."); }
  } else {
    // unverified: let the person set the password they just typed (they must still prove the email)
    await users.updateOne({ _id: existing._id }, { $set: { name: d.name, passwordHash: await hashPassword(d.password), updatedAt: new Date() } });
  }
  const code = await issueOtp(d.email, "verify");
  await otpEmail(d.email, code, "verify");
  const dev = process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY;
  return { needsVerify: true, email: d.email, ...(dev ? { devCode: code } : {}) };
});
