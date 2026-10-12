import Link from "next/link";
import PricingClient from "@/components/marketing/PricingClient";
import { CtaBand, Ld, PageHero } from "@/components/marketing/shared";
import { SectionHead } from "@/components/ui";
import { PLANS } from "@/lib/plans";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Plans and pricing", description: "Start free. Pay for productivity, advanced AI and capacity, never for visibility. Builder Pro from ₹299 a month, Founder Pro from ₹999 a month.", path: "/pricing" });

const FAQ = [
  ["Is the core network really free?", "Yes. Discovery, a basic profile, proof of work, link sharing, bonds, messaging and joining squads stay free."],
  ["Do you sell ads or ranking boosts?", "No. Paid plans add productivity and capacity. Nobody can pay to appear higher."],
  ["Is GST included?", "Prices are shown before GST. The final price, GST and billing terms are shown before you confirm any payment."],
  ["Does my plan renew automatically?", "No. Plans are paid for one period at a time and you renew when you choose. Nothing is charged without your confirmation."],
  ["What happens if my plan ends?", "Your account returns to the Free plan. We never delete your profile, blueprints, carts or projects. Extra items become read-only until you upgrade or remove them."],
  ["Does Skilion hold money between teammates?", "No. Members agree compensation directly. Skilion does not act as an escrow or payment platform between members."],
];
export default function Page() {
  const ids = ["free", "builder_pro", "founder_pro", "squad_workspace"] as const;
  const L = (id: (typeof ids)[number]) => PLANS[id].limits;
  const table: [string, (id: (typeof ids)[number]) => string][] = [
    ["AI runs per month", (id) => String(L(id).aiPerMonth)],
    ["Saved blueprints", (id) => String(L(id).blueprints)],
    ["Squad Cart drafts", (id) => String(L(id).carts)],
    ["Saved searches", (id) => (L(id).savedSearches ? String(L(id).savedSearches) : "Not included")],
    ["7-day availability heatmap", (id) => (L(id).heatmap ? "Included" : "Not included")],
    ["Profile and project analytics", (id) => (L(id).analytics ? "Included" : "Not included")],
  ];
  return (
    <>
      <Ld data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
      <PageHero crumbs={[{ name: "Pricing", path: "/pricing" }]} eyebrow="Plans and pricing" title="Start free. Pay for time saved, not for being seen." lead="No ads and no paid ranking. Upgrade when you want more AI planning, analytics or team capacity." art="pricing" />
      <section className="section section-white"><div className="container"><PricingClient /></div></section>
      <section className="section section-ice"><div className="container stack-lg">
        <SectionHead eyebrow="Compare" title="Limits at a glance" />
        <div className="table-wrap"><table className="table"><thead><tr><th>Feature</th>{ids.map((i) => <th key={i}>{PLANS[i].name}</th>)}</tr></thead><tbody>{table.map(([label, f]) => <tr key={label}><td>{label}</td>{ids.map((i) => <td key={i}>{f(i)}</td>)}</tr>)}</tbody></table></div>
        <p className="muted small">Limits may change as we learn how teams use Skilion. Changes never delete existing content.</p>
      </div></section>
      <section className="section section-white"><div className="container container-narrow stack-lg">
        <SectionHead eyebrow="Questions" title="Pricing FAQ" />
        <div className="stack">{FAQ.map(([q, a]) => <details key={q} className="card card-pad-sm"><summary style={{ fontWeight: 700, cursor: "pointer" }}>{q}</summary><p className="muted mt-8">{a}</p></details>)}</div>
        <p className="muted">More questions? <Link href="/contact">Contact us</Link>.</p>
      </div></section>
      <CtaBand title="Try it before you pay" body="Free accounts include a profile, the directory, bonds, messaging and three AI plans a month." primary={{ href: "/signup", label: "Start free" }} />
    </>
  );
}
