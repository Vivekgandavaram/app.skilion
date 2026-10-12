import Link from "next/link";
import FeaturedBuilders from "@/components/marketing/FeaturedBuilders";
import OpenRequests from "@/components/marketing/OpenRequests";
import Illustration, { hasIllustration } from "@/components/Illustration";
import { CtaBand, Ld } from "@/components/marketing/shared";
import "@/components/marketing/marketing.css";
import { pageMeta, SITE } from "@/lib/seo";
import { env } from "@/lib/env";

export const metadata = pageMeta({
  title: "Skilion: Build Extraordinary Teams, Together.",
  description: "Find collaborators by what they have built. Validate an idea, build a prototype, get help or start a company with a small team, around a day job or full time.",
  path: "",
});

const GOALS = [
  { goal: "validate", title: "Test an idea", body: "Four weeks, a small squad and a written plan, to learn whether the idea deserves more of your time." },
  { goal: "prototype", title: "Build a first version", body: "A designer, an engineer or a domain expert for the part you cannot do yourself." },
  { goal: "help", title: "Get unstuck", body: "One specialist for one focused session, when a single problem is blocking you." },
  { goal: "company", title: "Start a company", body: "Co-founders and early teammates who can show what they have already shipped." },
];
const STEP_ART = ["method-profile", "method-discover", "method-squad", "method-workspace"];
const KINDS = [
  { slot: "opp-research", title: "Research and field science", body: "Equipment, data and analysis help for a small study." },
  { slot: "opp-robotics", title: "Robotics and hardware", body: "Engineers and testers for a machine that needs to work outdoors." },
  { slot: "opp-product", title: "Learning and consumer products", body: "Designers and builders for a product that real users try early." },
];
const STEPS = [
  { title: "Show your work", body: "Add a project with a demo or repository link. A skill earns a check when a project backs it up." },
  { title: "Search by constraint", body: "Filter by skill, hours per week and time-zone overlap instead of job titles." },
  { title: "Collect candidates", body: "Put people into a Squad Cart against the roles your plan needs. See skill coverage and shared hours before you invite anyone." },
  { title: "Invite, then work", body: "Accepted invitations become a project with tasks, weekly check-ins and a decision log." },
];

export default function Home() {
  const site = { "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: env.siteUrl, description: SITE.description, potentialAction: { "@type": "SearchAction", target: `${env.siteUrl}/explore?q={search_term_string}`, "query-input": "required name=search_term_string" } };
  return (
    <>
      <Ld data={site} />
      <section className="hero" aria-labelledby="hero-title">
        <div className="container split">
          <div className="stack-lg">
            <div className="stack">
              <h1 className="h-hero" id="hero-title">Find the people to build it with. Check what they have shipped first.</h1>
              <p className="lead">Skilion helps you assemble a small team for a real idea: test it, prototype it, get unstuck or start the company. Every profile links to work you can inspect, and every skill reflects what has actually been built.</p>
            </div>
            <div className="hero-actions">
              <Link className="btn btn-primary btn-lg" href="/signup">Create your profile</Link>
              <Link className="btn btn-ghost btn-lg" href="/how-it-works">How teams form</Link>
            </div>
            <ul className="facts"><li><b>Free</b> to join</li><li><b>Bond</b> first, then message</li><li>No money passes through Skilion</li></ul>
          </div>
          <div className="hero-stack"><Illustration id="hero" priority /></div>
        </div>
      </section>

      <section className="section section-white" aria-labelledby="goals-title">
        <div className="container stack-lg">
          <h2 className="h2" id="goals-title" style={{ maxWidth: 560 }}>What do you need a team for?</h2>
          <div className="rows" role="list">
            {GOALS.map((g) => (
              <Link key={g.goal} role="listitem" href={`/signup?goal=${g.goal}`}>
                <Illustration id={`goal-${g.goal}`} /><h3>{g.title}</h3><p>{g.body}</p><span className="go">Start</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-dark on-dark" aria-labelledby="how-title">
        <div className="container">
          <div className="steps-head">
            <h2 className="h2" id="how-title">From a profile to a working team</h2>
            <div className="stack">
              <p className="lead">Four steps, each one visible in the product. Nothing happens to you without your say.</p>
              <div><Link className="btn btn-outline-light" href="/how-it-works">Read the walkthrough</Link></div>
            </div>
          </div>
          <ol className="steps-grid">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <div className="step-art">{STEP_ART[i] && hasIllustration(STEP_ART[i]) ? <Illustration id={STEP_ART[i]} /> : <span className="step-bignum" aria-hidden>{i + 1}</span>}</div>
                <h3><span className="step-n" aria-hidden>{i + 1}</span>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="after-title">
        <div className="container mk-two">
          <div className="stack">
            <h2 className="h2" id="after-title">Built for evenings and weekends</h2>
            <p className="lead">You do not need to quit your job to build something. Skilion is for the hours you choose, and for work where your judgment is the point.</p>
            <Illustration id="after-hours" />
          </div>
          <ul className="rows" style={{ listStyle: "none" }}>
            {[
              ["Offer a session or a role", "Sell focused help or a defined slot in a project. This is not hourly piecework."],
              ["Say when you are free", "Set weekly hours and your time zone. Teams see the overlap before they ask."],
              ["Pick how you are rewarded", "Paid, equity, revenue share, learning credit or volunteer. Each request states it up front."],
              ["Agree terms directly", "Skilion does not hold money between teammates. You settle terms between yourselves."],
            ].map(([t, b]) => <li key={t}><h3>{t}</h3><p>{b}</p><span /></li>)}
          </ul>
        </div>
      </section>

      <section className="section section-white" aria-labelledby="talent-title">
        <div className="container stack-lg">
          <div className="row between" style={{ alignItems: "flex-end" }}>
            <div className="stack" style={{ maxWidth: 620 }}>
              <h2 className="h2" id="talent-title">Builders who chose to be found</h2>
              <p className="lead">Public profiles only. Open one to see projects, links and which skills have proof behind them.</p>
            </div>
            <Link className="btn btn-ghost" href="/explore">Browse everyone</Link>
          </div>
          <FeaturedBuilders />
        </div>
      </section>

      <section className="section" aria-labelledby="opps-title">
        <div className="container stack-lg">
          <div className="stack" style={{ maxWidth: 640 }}>
            <h2 className="h2" id="opps-title">Open requests</h2>
            <p className="lead">Written by members who need people for a project. Skilion does not post on anyone&apos;s behalf.</p>
          </div>
          <OpenRequests />
        </div>
      </section>

      {KINDS.some((k) => hasIllustration(k.slot)) && (
        <section className="section section-white" aria-labelledby="kinds-title">
          <div className="container stack-lg">
            <div className="stack" style={{ maxWidth: 640 }}>
              <h2 className="h2" id="kinds-title">Kinds of projects people start</h2>
              <p className="small muted">Examples of project types, not live listings.</p>
            </div>
            <div className="grid grid-3">
              {KINDS.map((k) => (
                <div key={k.slot} className="card" style={{ overflow: "hidden" }}>
                  <Illustration id={k.slot} rounded={false} />
                  <div className="stack-sm" style={{ padding: "14px 18px 18px" }}><h3 className="h4">{k.title}</h3><p className="small muted">{k.body}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {hasIllustration("global") && (
        <section className="section" aria-labelledby="global-title">
          <div className="container mk-two">
            <div className="stack">
              <h2 className="h2" id="global-title">Teams are not limited to one city</h2>
              <p className="lead">Filter by time-zone overlap, see when people are really free, and work with teammates in other regions without guessing.</p>
              <div><Link className="btn btn-ghost" href="/explore">Browse builders</Link></div>
            </div>
            <Illustration id="global" />
          </div>
        </section>
      )}

      <CtaBand title="Add one project and one skill. That is enough to be found." body="Your profile is free. You choose what is public and when you are available." primary={{ href: "/signup", label: "Create your profile" }} secondary={{ href: "/for-founders", label: "I have an idea" }} />
    </>
  );
}
