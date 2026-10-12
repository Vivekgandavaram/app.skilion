import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { activatePayment } from "@/lib/billing-activate";
import { col } from "@/lib/db";

/** Razorpay webhook: payment.captured / order.paid activate the plan even if the browser closed early. Configure the same secret as RAZORPAY_WEBHOOK_SECRET. */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") || "";
  if (!process.env.RAZORPAY_WEBHOOK_SECRET || !sig || !verifyWebhookSignature(raw, sig)) return NextResponse.json({ error: "bad signature" }, { status: 400 });
  try {
    const ev = JSON.parse(raw);
    const pay = ev?.payload?.payment?.entity;
    if ((ev.event === "payment.captured" || ev.event === "order.paid") && pay?.order_id && pay?.id) await activatePayment(pay.order_id, pay.id);
    if (ev.event === "payment.failed" && pay?.order_id) await (await col("payments")).updateOne({ orderId: pay.order_id, status: "created" }, { $set: { status: "failed" } });
    if (ev.event === "refund.processed" && ev?.payload?.refund?.entity?.payment_id) await (await col("payments")).updateOne({ paymentId: ev.payload.refund.entity.payment_id }, { $set: { status: "refunded" } });
  } catch (e) { console.error("webhook", e); }
  return NextResponse.json({ ok: true });
}
