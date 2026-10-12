import { z } from "zod";
import { route, body } from "@/lib/api";
import { col } from "@/lib/db";
import { issueOtp } from "@/lib/otp";
import { otpEmail } from "@/lib/email";
import { checkRate } from "@/lib/security";

export const POST = route({ rate: { key: "forgot", limit: 10, windowSec: 3600 } }, async ({ req }) => {
  const { email } = await body(req, z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email") }));
  const gap = await checkRate(`forgot-min:${email}`, 1, 60);
  let devCode: string | undefined;
  if (gap.ok) {
    const u = await (await col("users")).findOne({ email });
    if (u && u.status === "active") {
      const code = await issueOtp(email, "reset");
      await otpEmail(email, code, "reset");
      if (process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY) devCode = code;
    }
  }
  return { ok: true, ...(devCode ? { devCode } : {}) }; // same answer whether or not the account exists
});
