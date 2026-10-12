import Link from "next/link";
import { Check } from "lucide-react";
import Illustration from "@/components/Illustration";
import { SectionHead } from "@/components/ui";
import { CtaBand, PageHero } from "@/components/marketing/shared";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Skilion for founders", description: "Validate an idea, build a prototype, get unblocked or find co-founders. Turn an idea into a team plan and invite builders who have shown their work.", path: "/for-founders" });

const USES = [
  { slot: "goal-validate", t: "Validate before you build", d: "A small squad of a product lead, a designer and an outreach person can run ten conversations and a clickable concept in four weeks. Skilion helps you find them and plan it." },
  { slot: "goal-prototype", t: "Build the thinnest working version", d: "Find an engineer and a designer who have already shipped something similar. Agree hours, scope and how contributors are rewarded before anyone starts." },
  { slot: "goal-help", t: "Get unblocked fast", d: "Need a specialist for 45 minutes on pricing, a model, a circuit or a contract clause? Ask for a focused session instead of a long engagement." },
  { slot: "goal-company", t: "Find co-founders and early teammates", d: "Look for people with real evidence, compatible hours and a compensation mindset that matches yours: equity, revenue share or paid." },
];

export default function Page() {
  return (
    <>
      <PageHero crumbs={[{ name: "For founders", path: "/for-founders" }]} eyebrow="For founders" title="Write the idea. Get a plan with roles, hours and milestones." lead="The planner drafts a team plan you can edit line by line. Then search for people whose work shows they can do each role." art="founders" actions={<><Link href="/build" className="btn btn-primary btn-lg">Build an idea with AI</Link><Link href="/explore" className="btn btn-ghost btn-lg">Explore builders</Link></>} />
      <section className="section section-white"><div className="container stack-lg">
        <SectionHead eyebrow="Four ways founders use Skilion" title="Small teams, clear goals" sub="Skilion is not a job board. It is a place to form a squad around a goal, whatever the scale." />
        <div className="grid grid-2">{USES.map((u) => <article key={u.t} className="card goal-card"><Illustration id={u.slot} rounded={false} /><div className="stack-sm" style={{ padding: "4px 24px 24px" }}><h3 className="h3">{u.t}</h3><p className="muted">{u.d}</p></div></article>)}</div>
      </div></section>
      <section className="section section-dark"><div className="container split">
        <div className="stack">
          <span className="eyebrow">The Squad Cart</span>
          <h2 className="h2">See gaps before you send a single invitation</h2>
          <ul className="stack-sm" style={{ listStyle: "none", padding: 0 }}>
            {["Essential skills covered or missing, with evidence markers.", "Seven-day availability heatmap across time zones (Founder Pro).", "Estimated cost against your stated budget.", "Multiple drafts, and a read-only link for an advisor.", "Invitations with a personal message and clear status."].map((x) => <li key={x} className="row-nowrap" style={{ alignItems: "flex-start" }}><Check size={18} color="var(--ice)" style={{ marginTop: 4, flex: "none" }} />{x}</li>)}
          </ul>
          <p className="muted small">The AI plan is a recommendation, not a hiring decision or a guarantee of success.</p>
        </div>
        <Illustration id="method-squad" />
      </div></section>
      <CtaBand title="Your first plan is free" body="Free accounts include three AI Squad Architect runs each month." primary={{ href: "/signup?goal=validate", label: "Start free" }} secondary={{ href: "/pricing", label: "See plans" }} />
    </>
  );
}
