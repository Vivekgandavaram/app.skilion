import crypto from "node:crypto";

const base = "https://api.razorpay.com/v1";
export const razorpayConfigured = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
const auth = () => "Basic " + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");

export async function createOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
  const res = await fetch(`${base}/orders`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt: receipt.slice(0, 40), notes }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed (${res.status})`);
  return (await res.json()) as { id: string; amount: number; currency: string };
}

const eq = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const exp = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "").update(`${orderId}|${paymentId}`).digest("hex");
  return eq(exp, signature);
}
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const exp = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "").update(rawBody).digest("hex");
  return eq(exp, signature);
}
