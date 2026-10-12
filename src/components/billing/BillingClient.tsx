"use client";
import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import useSWR from "swr";
import { Check } from "lucide-react";
import { api, fetcher } from "@/lib/client";
import { Modal, Segmented, Skeleton, useToast } from "@/components/client-ui";
import { PLANS } from "@/lib/plans";
import type { Interval } from "@/lib/types";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
declare global { interface Window { Razorpay?: any } }

export default function BillingClient() {
  const { toast } = useToast();
  const { data, mutate, isLoading } = useSWR("/api/billing/status", fetcher);
  const [interval, setInterval] = useState<Interval>("month");
  const [pick, setPick] = useState<"builder_pro" | "founder_pro" | null>(null);
  const [busy, setBusy] = useState(false);
  if (isLoading || !data) return <Skeleton h={300} />;
  const cur = data.plan.id;
  const q = pick ? data.quotes[pick][interval] : null;

  async function pay() {
    if (!pick) return; setBusy(true);
    try {
      const o = await api.post("/api/billing/order", { plan: pick, interval });
      if (!window.Razorpay) throw new Error("The payment window could not load. Check your connection and try again.");
      const rz = new window.Razorpay({
        key: o.keyId, amount: o.amount, currency: o.currency, order_id: o.orderId, name: "Skilion", description: `${o.plan}, ${interval === "year" ? "1 year" : "1 month"}`, prefill: { name: o.name, email: o.email }, theme: { color: "#159BD4" },
        handler: async (r: any) => { try { const v = await api.post("/api/billing/verify", r); toast(v.activated ? "Your plan is active." : "Payment recorded.", "ok"); setPick(null); mutate(); } catch (e: any) { toast(e.message, "err"); } },
        modal: { ondismiss: () => setBusy(false) },
      });
      rz.on("payment.failed", (r: any) => toast(r?.error?.description || "The payment failed. You were not charged.", "err"));
      rz.open();
    } catch (e: any) { toast(e.message, "err"); setBusy(false); }
  }
  const meter = (label: string, used: number, limit: number) => (<div key={label} className="stack-sm"><div className="row between small"><span>{label}</span><span className="tnum">{used} / {limit}</span></div><div className="meter" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={limit} aria-label={label}><i style={{ width: `${Math.min(100, (used / Math.max(1, limit)) * 100)}%` }} /></div></div>);
  return (
    <div className="stack-lg">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <section className="card card-pad stack">
        <div className="row between"><div><span className="eyebrow">Current plan</span><h2 className="h2">{data.plan.name}</h2></div>{data.plan.expiresAt && cur !== "free" && <span className="chip chip-line">Valid until {new Date(data.plan.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}</div>
        {data.plan.lapsed && <div className="alert alert-warn">Your paid plan ended. You are on Free. Nothing was deleted; limits apply to new activity.</div>}
        <div className="grid grid-3">{meter("AI plans this month", data.usage.ai.used, data.usage.ai.limit)}{meter("Saved blueprints", data.usage.blueprints.used, data.usage.blueprints.limit)}{meter("Squad Carts", data.usage.carts.used, data.usage.carts.limit)}</div>
        <p className="xs muted">Plans are one-time purchases for a month or a year. They do not renew automatically.</p>
      </section>
      <div className="row between"><h2 className="h3">Upgrade</h2><Segmented label="Billing period" value={interval} onChange={setInterval} options={[{ value: "month", label: "Monthly" }, { value: "year", label: "Yearly (about 2 months free)" }]} /></div>
      <div className="grid grid-2">
        {(["builder_pro", "founder_pro"] as const).map((id) => { const p = PLANS[id]; const b = data.quotes[id][interval]; return (
          <div key={id} className={`card plan ${id === "founder_pro" ? "featured" : ""}`}>
            <b>{p.name}</b><p className="small muted">{p.tagline}</p>
            <div className="price tnum">{inr(b.subtotal)}<span className="small muted" style={{ fontWeight: 500 }}> / {interval === "year" ? "year" : "month"} + GST</span></div>
            <ul>{p.features.slice(0, 7).map((f) => <li key={f}><Check aria-hidden />{f}</li>)}</ul>
            <button className="btn btn-primary" disabled={cur === id && !data.plan.lapsed ? false : false} onClick={() => setPick(id)}>{cur === id ? "Extend" : cur === "founder_pro" && id === "builder_pro" ? "Switch to Builder Pro" : p.cta}</button>
          </div>); })}
      </div>
      <p className="small muted">Squad Workspace and Enterprise are not self-serve yet. <Link href="/contact">Contact us</Link>.</p>
      {data.payments.length > 0 && (<section className="stack"><h2 className="h3">Receipts</h2><div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Plan</th><th>Amount</th><th></th></tr></thead><tbody>
        {data.payments.map((p: any) => <tr key={p.id}><td>{new Date(p.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td><td>{p.planName} ({p.interval})</td><td className="tnum">{inr(p.amount)}</td><td><Link href={`/settings/billing/receipt/${p.id}`}>View</Link></td></tr>)}</tbody></table></div></section>)}
      <Modal open={!!pick} onClose={() => setPick(null)} title={pick ? `${PLANS[pick].name}, ${interval === "year" ? "1 year" : "1 month"}` : ""}>
        {q && <div className="stack">
          <div className="table-wrap"><table className="table"><tbody><tr><td>Plan price</td><td className="tnum" style={{ textAlign: "right" }}>{inr(q.subtotal)}</td></tr><tr><td>GST ({q.gstPercent}%)</td><td className="tnum" style={{ textAlign: "right" }}>{inr(q.tax)}</td></tr><tr><td><b>Total</b></td><td className="tnum" style={{ textAlign: "right" }}><b>{inr(q.total)}</b></td></tr></tbody></table></div>
          <p className="xs muted">Paid securely through Razorpay (UPI, cards, netbanking, wallets). One-time payment, no automatic renewal. Activates immediately after payment.</p>
          {!data.checkoutReady && <div className="alert alert-warn">Payments are not configured on this server yet (Razorpay keys missing).</div>}
          <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn btn-ghost" onClick={() => setPick(null)}>Cancel</button><button className="btn btn-primary" onClick={pay} disabled={busy || !data.checkoutReady}>{busy ? <span className="spinner" /> : `Pay ${inr(q.total)}`}</button></div>
        </div>}
      </Modal>
    </div>
  );
}
