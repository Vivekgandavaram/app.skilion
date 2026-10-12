import { Check } from "lucide-react";
import Illustration from "@/components/Illustration";
import { SectionHead, VerifyBadges, VERIFY_COPY } from "@/components/ui";
import { CtaBand, PageHero } from "@/components/marketing/shared";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "How Skilion works", description: "Discover people, inspect proof of work, assemble a Squad Cart, compare skills and availability, invite, collaborate and record outcomes.", path: "/how-it-works" });

const LOOP = [
  { slot: "method-profile", t: "Show your work", d: "Add projects, demos and repositories. Link each skill to the work that proves it. Skills without evidence stay marked as self-claimed, so nobody has to guess." },
  { slot: "method-discover", t: "Find people through what they made", d: "Search by skill, goal, hours per week and time zone. Open a profile and look at projects, outcomes and what each badge actually checked." },
  { slot: "method-squad", t: "Assemble a Squad Cart", d: "Stage candidates by role. Skilion shows which essential skills are covered, which are gaps, how your weekly hours overlap and what the team costs against your budget." },
  { slot: "method-workspace", t: "Invite, then work together", d: "Nobody joins because they were added to a cart. You send an invitation, they accept or decline, and an accepted squad gets a workspace with tasks, milestones, check-ins and a decision log." },
];

export default function Page() {
  return (
    <>
      <PageHero crumbs={[{ name: "How it works", path: "/how-it-works" }]} eyebrow="The Skilion loop" title="How a team forms on Skilion" lead="Search, check proof, collect candidates, compare skills and hours, bond, work together, and keep a record of what happened." art="method-squad" />
      <section className="section section-white"><div className="container stack-lg">
        <SectionHead eyebrow="Four steps" title="Built for teams that form around real work" sub="Every step stays in your hands. The planner suggests; you decide." />
        <div className="grid grid-2">
          {LOOP.map((s, i) => (
            <article key={s.t} className="card card-pad stack">
              <Illustration id={s.slot} />
              <span className="step-n" style={{ color: "var(--blue-ink)" }}>STEP {i + 1}</span>
              <h3 className="h3">{s.t}</h3><p className="muted">{s.d}</p>
            </article>
          ))}
        </div>
      </div></section>

      <section className="section section-dark"><div className="container stack-lg">
        <SectionHead eyebrow="Bonds" title="Bonds and squad invitations are different things" sub="A Bond is a mutual tie between two people. It unlocks messaging. A squad invitation asks one person to take a role in a specific project." />
        <div className="grid grid-3">
          {[["Bond request", "Send a short, specific note. The other person accepts or declines. Requests expire after 30 days and are rate limited to stop spam."], ["Squad invitation", "Tied to a project and a role, with hours per week and an optional message. Accepting adds the person to the project and its group chat."], ["Draft squads", "Adding someone to a Squad Cart never makes them a member and never notifies them. Only an invitation does."]].map(([t, d]) => (
            <div key={t} className="mk-card-dark"><h3 className="h3">{t}</h3><p className="muted">{d}</p></div>
          ))}
        </div>
      </div></section>

      <section className="section section-ice"><div className="container split">
        <div className="stack">
          <span className="eyebrow">AI Squad Architect</span>
          <h2 className="h2">An editable plan, not a verdict</h2>
          <p className="lead">Describe your idea, the stage, your budget and how long you have. You get a summary, assumptions, roles with hours, milestones, risks and open questions. Edit anything, regenerate, then match builders to each role.</p>
          <ul className="stack-sm" style={{ listStyle: "none", padding: 0 }}>
            {["Every recommendation explains itself with evidence from profiles.", "Uncertainty is stated instead of invented.", "AI never sends invitations or publishes anything for you.", "You can opt out of AI-assisted matching in privacy settings."].map((x) => <li key={x} className="row-nowrap" style={{ alignItems: "flex-start" }}><Check size={18} color="var(--ok)" style={{ marginTop: 4, flex: "none" }} />{x}</li>)}
          </ul>
        </div>
        <Illustration id="founders" />
      </div></section>

      <section className="section section-white"><div className="container stack-lg">
        <SectionHead eyebrow="Trust" title="What each badge means" sub="Skilion never shows a bare “Verified”. Every badge says exactly what was checked." />
        <div className="grid grid-3">
          {Object.entries(VERIFY_COPY).map(([k, v]) => (
            <div key={k} className="card card-pad stack-sm"><VerifyBadges items={[{ type: k }]} /><p className="muted small">{v.meaning}</p></div>
          ))}
        </div>
      </div></section>

      <section className="section section-ice"><div className="container split split-rev">
        <Illustration id="method-workspace" />
        <div className="stack">
          <span className="eyebrow">Projects</span>
          <h2 className="h2">A workspace that respects everyone&apos;s hours</h2>
          <p className="lead">Milestones, a task board, weekly check-ins with hours, a decision log and shared links. When the work ends, each member decides whether their contribution appears on their profile or in the public showcase.</p>
        </div>
      </div></section>
      <CtaBand title="Start with your own work" body="Create a free profile, add one project and see who is looking for what you can do." primary={{ href: "/signup", label: "Start free" }} secondary={{ href: "/explore", label: "Explore builders" }} />
    </>
  );
}
