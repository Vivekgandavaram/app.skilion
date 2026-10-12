import { route } from "@/lib/api";
import { col } from "@/lib/db";
import { effectivePlan, PLANS, aiRemaining, priceBreakdown } from "@/lib/plans";
import { razorpayConfigured } from "@/lib/razorpay";
import { ser } from "@/lib/serialize";

export const GET = route({ auth: true }, async ({ user }) => {
  const eff = effectivePlan(user);
  const pays = await (await col("payments")).find({ userId: user._id, status: "paid" }).sort({ createdAt: -1 }).limit(24).toArray();
  const [carts, blueprints] = await Promise.all([(await col("carts")).countDocuments({ ownerId: user._id }), (await col("blueprints")).countDocuments({ ownerId: user._id })]);
  return {
    plan: { id: eff.id, name: eff.name, interval: user.plan.interval, expiresAt: user.plan.expiresAt?.toISOString(), lapsed: user.plan.id !== "free" && eff.id === "free" },
    usage: { ai: aiRemaining(user), carts: { used: carts, limit: eff.limits.carts }, blueprints: { used: blueprints, limit: eff.limits.blueprints } },
    payments: pays.map((p) => ser({ _id: p._id, planId: p.planId, planName: PLANS[p.planId].name, interval: p.interval, amount: p.amount, subtotal: p.subtotal, tax: p.tax, paidAt: p.paidAt, orderId: p.orderId })),
    checkoutReady: razorpayConfigured(), keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || null,
    quotes: Object.fromEntries((["builder_pro", "founder_pro"] as const).map((id) => [id, { month: priceBreakdown(id, "month"), year: priceBreakdown(id, "year") }])),
  };
});
