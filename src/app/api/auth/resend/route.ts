import { z } from "zod";
import { route, body } from "@/lib/api";
import { col } from "@/lib/db";
import { issueOtp } from "@/lib/otp";
import { otpEmail } from "@/lib/email";
import { checkRate } from "@/lib/security";

const Schema = z.object({ email: z.string().trim().toLowerCase().email(), purpose: z.enum(["verify", "reset", "mfa"]) });

export const POST = route({ rate: { key: "resend-ip", limit: 20, windowSec: 3600 } }, async ({ req }) => {
  const d = await body(req, Schema);
  const gap = await checkRate(`resend-min:${d.email}:${d.purpose}`, 1, 60);
  if (!gap.ok) return { ok: true, wait: gap.retryAfter };
  const hr = await checkRate(`resend-hr:${d.email}:${d.purpose}`, 5, 3600);
  if (!hr.ok) return { ok: true, wait: hr.retryAfter };
  const u = await (await col("users")).findOne({ email: d.email });
  let devCode: string | undefined;
  const allowed = u && ((d.purpose === "verify" && !u.emailVerified) || d.purpose === "reset" || (d.purpose === "mfa" && u.mfa?.enabled));
  if (allowed) {
    const code = await issueOtp(d.email, d.purpose);
    await otpEmail(d.email, code, d.purpose);
    if (process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY) devCode = code;
  }
  return { ok: true, wait: 60, ...(devCode ? { devCode } : {}) };
});
