import { z } from "zod";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { checkOtp } from "@/lib/otp";
import type { UserDoc } from "@/lib/types";

const Schema = z.object({ email: z.string().trim().toLowerCase().email(), code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") });
export const POST = route({ rate: { key: "mfa", limit: 20, windowSec: 900 } }, async ({ req }) => {
  const d = await body(req, Schema);
  const r = await checkOtp(d.email, "mfa", d.code);
  if (r !== "ok") throw new HttpError(400, r === "invalid" ? "That code is not right." : r === "locked" ? "Too many wrong tries. Request a new code." : "That code expired. Request a new one.", r);
  const u = (await (await col("users")).findOne({ email: d.email })) as UserDoc | null;
  if (!u || u.status === "suspended") throw new HttpError(403, "Cannot sign in.");
  await setSession(u._id.toString());
  return { ok: true, next: u.onboarded ? "/discover" : "/onboarding" };
});
