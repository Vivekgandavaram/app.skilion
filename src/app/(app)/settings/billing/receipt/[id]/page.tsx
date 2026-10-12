import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { col, oid } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { pageMeta } from "@/lib/seo";
import { env } from "@/lib/env";
import PrintButton from "@/components/billing/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Receipt", noindex: true });
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser("/settings/billing");
  const id = oid((await params).id); if (!id) notFound();
  const p = await (await col("payments")).findOne({ _id: id, userId: u._id, status: "paid" });
  if (!p) notFound();
  return (
    <article className="card card-pad stack" style={{ maxWidth: 560 }}>
      <h2 className="h2">Receipt</h2>
      <div className="small muted">Skilion by VIGO Tech · {env.siteUrl.replace(/^https?:\/\//, "")}</div>
      <table className="table"><tbody>
        <tr><td>Billed to</td><td>{u.name} ({u.email})</td></tr>
        <tr><td>Date</td><td>{p.paidAt ? new Date(p.paidAt).toLocaleString("en-IN") : ""}</td></tr>
        <tr><td>Plan</td><td>{PLANS[p.planId].name}, {p.interval === "year" ? "1 year" : "1 month"}</td></tr>
        <tr><td>Price</td><td className="tnum">{inr(p.subtotal)}</td></tr>
        <tr><td>GST ({env.gst}%)</td><td className="tnum">{inr(p.tax)}</td></tr>
        <tr><td><b>Total paid</b></td><td className="tnum"><b>{inr(p.amount)}</b></td></tr>
        <tr><td>Order</td><td className="xs">{p.orderId}</td></tr>
        <tr><td>Payment</td><td className="xs">{p.paymentId}</td></tr>
      </tbody></table>
      <p className="xs muted">This is a payment receipt. A GST tax invoice with your business details can be requested from support.</p>
      <div className="row"><PrintButton /></div>
    </article>
  );
}
