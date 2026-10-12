import { z } from "zod";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";
import { PLANS, priceBreakdown } from "@/lib/plans";
import { createOrder, razorpayConfigured } from "@/lib/razorpay";

export const POST = route({ auth: true, verified: true, rate: { key: "order", limit: 20, windowSec: 3600 } }, async ({ req, user }) => {
  const d = await body(req, z.object({ plan: z.enum(["builder_pro", "founder_pro"]), interval: z.enum(["month", "year"]) }));
  if (!PLANS[d.plan].available) throw new HttpError(400, "That plan is not on sale yet.");
  if (!razorpayConfigured()) throw new HttpError(503, "Payments are not configured on this server yet.", "payments_off");
  const q = priceBreakdown(d.plan, d.interval);
  const order = await createOrder(q.total * 100, `sk_${user._id.toString().slice(-8)}_${Date.now().toString(36)}`, { userId: user._id.toString(), plan: d.plan, interval: d.interval });
  await (await col("payments")).insertOne({ userId: user._id, planId: d.plan, interval: d.interval, amount: q.total, subtotal: q.subtotal, tax: q.tax, currency: "INR", orderId: order.id, status: "created", createdAt: new Date() } as any);
  return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID, name: user.name, email: user.email, plan: PLANS[d.plan].name, breakdown: q };
});
