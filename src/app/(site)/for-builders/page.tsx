import Link from "next/link";
import { Check } from "lucide-react";
import Illustration from "@/components/Illustration";
import { SectionHead } from "@/components/ui";
import { CtaBand, PageHero } from "@/components/marketing/shared";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Skilion for builders", description: "Show your work, set your hours and rate, and sell your expertise to teams that need it, around a day job or full time.", path: "/for-builders" });

export default function Page() {
  return (
    <>
      <PageHero crumbs={[{ name: "For builders", path: "/for-builders" }]} eyebrow="For builders and specialists" title="Sell a session or a role, not your hours" lead="Set the hours you have, say how you want to be rewarded, and take work where your judgment is the point. It fits around a 9 to 6." art="builders" actions={<><Link href="/signup?goal=help" className="btn btn-primary btn-lg">Show your work</Link><Link href="/resources/sell-your-skills-not-your-hours" className="btn btn-ghost btn-lg">Read the guide</Link></>} />
      <section className="section section-white"><div className="container stack-lg">
        <SectionHead eyebrow="What you control" title="You set the terms" />
        <div className="grid grid-3">
          {[["Evidence-backed skills", "Link a skill to the project that proves it. Evidenced skills stand out from claims."], ["Your hours", "Choose presets like after work or weekends, draw your own weekly grid and set hours per week. People see overlap in their time zone."], ["Your rate and rewards", "Show an hourly or per-session rate if you want to. Accept paid, equity, revenue share, learning credit or volunteer work, or any mix."], ["Focused sessions", "Offer 45-minute help sessions when you cannot commit weeks. Squads can also invite you to a role with weekly hours."], ["Privacy by field", "Public profile is off by default. Choose what members see: location, rate, availability and links."], ["Endorsements from people you worked with", "Peers can endorse a skill after a bond or shared project. Badges say exactly what was checked."]].map(([t, d]) => <div key={t} className="card card-pad stack-sm"><h3 className="h3">{t}</h3><p className="muted">{d}</p></div>)}
        </div>
      </div></section>
      <section className="section section-ice"><div className="container split">
        <Illustration id="after-hours" />
        <div className="stack">
          <span className="eyebrow">Around a day job</span>
          <h2 className="h2">Sell judgment, not cheap labour</h2>
          <p className="lead">Part-time gigs trade your evenings for low pay. On Skilion you join a squad because your expertise changes the outcome, and you agree the reward up front.</p>
          <ul className="stack-sm" style={{ listStyle: "none", padding: 0 }}>{["Short, scoped sessions or small weekly commitments", "A visible &quot;Builds after hours&quot; marker, never a penalty", "Skilion does not hold money between teammates. You agree terms directly"].map((x) => <li key={x} className="row-nowrap" style={{ alignItems: "flex-start" }}><Check size={18} color="var(--ok)" style={{ marginTop: 4, flex: "none" }} /><span dangerouslySetInnerHTML={{ __html: x }} /></li>)}</ul>
        </div>
      </div></section>
      <CtaBand title="Add one project and see who needs it" body="It takes about fifteen minutes to publish a profile with proof of work." primary={{ href: "/signup", label: "Start free" }} secondary={{ href: "/explore", label: "Browse builders" }} />
    </>
  );
}
