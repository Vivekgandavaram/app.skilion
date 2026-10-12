import { col } from "./db";
import { notify } from "./notify";
import { PLANS } from "./plans";
import type { PaymentDoc, UserDoc } from "./types";

/**
 * Mark a payment paid and switch the plan on. Idempotent: the browser callback and the webhook can both call it;
 * only the first one that flips status created->paid does the work. One-time purchase, no auto-renewal: plans expire and fall back to Free.
 */
export async function activatePayment(orderId: string, paymentId: string): Promise<{ activated: boolean; payment: PaymentDoc | null }> {
  const payments = await col("payments");
  const p = (await payments.findOneAndUpdate({ orderId, status: { $ne: "paid" } }, { $set: { status: "paid", paymentId, paidAt: new Date() } }, { returnDocument: "after" })) as PaymentDoc | null;
  if (!p) return { activated: false, payment: (await payments.findOne({ orderId })) as PaymentDoc | null };
  const users = await col("users");
  const u = (await users.findOne({ _id: p.userId })) as UserDoc | null;
  if (!u) return { activated: false, payment: p };
  const days = p.interval === "year" ? 365 : 30;
  const base = u.plan.id === p.planId && u.plan.expiresAt && new Date(u.plan.expiresAt) > new Date() ? new Date(u.plan.expiresAt) : new Date();
  const expiresAt = new Date(base.getTime() + days * 86400_000);
  await users.updateOne({ _id: u._id }, { $set: { plan: { id: p.planId, interval: p.interval, expiresAt }, updatedAt: new Date() } });
  await notify(u._id, "system", `${PLANS[p.planId].name} is active`, `Valid until ${expiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}. Receipt in Settings, Plan and billing.`, "/settings/billing");
  return { activated: true, payment: p };
}
