import { z } from "zod";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { activatePayment } from "@/lib/billing-activate";

/** Browser callback after Razorpay checkout. The signature is verified server-side; the webhook is the backup. */
export const POST = route({ auth: true, rate: { key: "pay-verify", limit: 30, windowSec: 3600 } }, async ({ req, user }) => {
  const d = await body(req, z.object({ razorpay_order_id: z.string(), razorpay_payment_id: z.string(), razorpay_signature: z.string() }));
  const pay = await (await col("payments")).findOne({ orderId: d.razorpay_order_id, userId: user._id });
  if (!pay) throw new HttpError(404, "We could not find that order.");
  if (!verifyPaymentSignature(d.razorpay_order_id, d.razorpay_payment_id, d.razorpay_signature)) throw new HttpError(400, "Payment could not be verified. If money left your account, contact support with your order id: " + d.razorpay_order_id);
  const r = await activatePayment(d.razorpay_order_id, d.razorpay_payment_id);
  return { ok: true, activated: r.activated, receiptId: pay._id.toString() };
});
