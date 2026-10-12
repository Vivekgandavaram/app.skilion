"use client";
import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS, ENTERPRISE, type PlanDef } from "@/lib/plans";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const order: PlanDef["id"][] = ["free", "builder_pro", "founder_pro", "squad_workspace"];

export default function PricingClient() {
  const [interval, setInterval] = useState<"month" | "year">("year");
  return (
    <div>
      <div className="mk-price-toggle">
        <div className="seg" role="group" aria-label="Billing period">
          <button type="button" aria-pressed={interval === "month"} onClick={() => setInterval("month")}>Monthly</button>
          <button type="button" aria-pressed={interval === "year"} onClick={() => setInterval("year")}>Yearly, save about 17%</button>
        </div>
      </div>
      <div className="mk-plans">
        {order.map((id) => {
          const p = PLANS[id];
          const price = p.price[interval];
          const saved = p.price.month * 12 - p.price.year;
          const href = id === "free" ? "/signup" : p.available ? `/settings/billing?plan=${id}&interval=${interval}` : "/contact?topic=enterprise";
          return (
            <article key={id} className={`card plan ${id === "founder_pro" ? "featured" : ""}`}>
              {id === "founder_pro" && <span className="chip chip-hot" style={{ justifySelf: "start" }}>Most popular for teams</span>}
              <div><h3 className="h3">{p.name}</h3><p className="muted small">{p.tagline}</p></div>
              <div>
                <div className="price tnum">{price === 0 ? "₹0" : inr(price)}<span className="muted small" style={{ fontWeight: 500 }}>{price === 0 ? " forever" : interval === "month" ? " / month" : " / year"}</span></div>
                {interval === "year" && saved > 0 && <p className="xs muted">Saves {inr(saved)} compared with 12 months</p>}
                {price > 0 && <p className="xs muted">GST added at checkout</p>}
              </div>
              <p className="small"><b>For:</b> {p.audience}</p>
              <ul>{p.features.map((f) => <li key={f}><Check aria-hidden />{f}</li>)}</ul>
              {p.available
                ? <Link href={href} className={`btn ${id === "free" ? "btn-dark" : "btn-primary"} btn-block`} style={{ marginTop: "auto" }}>{id === "free" ? "Start free" : p.cta}</Link>
                : <Link href={href} className="btn btn-ghost btn-block" style={{ marginTop: "auto" }}>Coming soon: join the waitlist</Link>}
            </article>
          );
        })}
      </div>
      <div className="card card-pad mt-24 row between">
        <div className="stack-sm" style={{ maxWidth: 640 }}><h3 className="h3">{ENTERPRISE.name}</h3><p className="muted">{ENTERPRISE.audience}. {ENTERPRISE.features.join(". ")}.</p></div>
        <Link href="/contact?topic=enterprise" className="btn btn-dark">Contact sales</Link>
      </div>
    </div>
  );
}
