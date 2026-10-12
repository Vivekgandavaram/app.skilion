"use client";
import "./auth.css";
import Illustration from "@/components/Illustration";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Hammer, Users, Lightbulb, Wrench, FlaskConical, LifeBuoy, Rocket } from "lucide-react";
import { api } from "@/lib/client";
import { Field, useToast } from "@/components/client-ui";
import { subdomainsOf } from "@/data/taxonomy";
import SkillPicker from "@/components/SkillPicker";
import AvailabilityGrid from "@/components/AvailabilityGrid";
import { COMPENSATION, COMP_LABEL, DOMAINS, GOALS, GOAL_LABEL, INTENTS, type Compensation, type Goal, type Intent } from "@/lib/types";
import { PRESETS } from "@/lib/availability";

const INTENT_INFO: Record<Intent, { t: string; d: string; icon: any }> = {
  offer_skills: { t: "Offer my skills", d: "Be found for your expertise, in focused sessions or project roles.", icon: Wrench },
  join_squads: { t: "Join squads", d: "Contribute to teams building something you believe in.", icon: Users },
  build_projects: { t: "Build projects", d: "Start something and invite people to work on it.", icon: Hammer },
  assemble_squads: { t: "Assemble and lead squads", d: "Turn an idea into a plan and a team.", icon: Lightbulb },
};
const GOAL_ICON: Record<Goal, any> = { validate: FlaskConical, prototype: Hammer, help: LifeBuoy, company: Rocket };
const STEPS = ["Intent", "Skills", "Your time", "Availability", "Links", "Privacy"];

type P = { intents: Intent[]; goals: Goal[]; headline: string; domain: string; subdomain: string; skills: string[]; dayJob: boolean; compensation: Compensation[]; rateMin: string; rateMax: string; rateUnit: "hour" | "session"; timezone: string; location: string; hours: number; status: "open" | "busy" | "unavailable"; slots: number[]; github: string; linkedin: string; website: string; public: boolean; showRate: boolean; showLocation: boolean; showAvailability: boolean; showLinks: boolean };

export default function Onboarding({ me }: { me: any }) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [p, setP] = useState<P>(() => ({
    intents: me.intents || [], goals: me.goals || [], headline: me.headline || "", domain: me.domain || "", subdomain: me.subdomain || "", skills: (me.skills || []).map((s: any) => s.name), dayJob: !!me.dayJob,
    compensation: me.compensation?.length ? me.compensation : ["paid", "equity", "revshare", "learning"], rateMin: me.rate ? String(me.rate.min) : "", rateMax: me.rate ? String(me.rate.max) : "", rateUnit: me.rate?.unit || "hour",
    timezone: me.timezone || "Asia/Kolkata", location: me.location || "", hours: me.availability?.hoursPerWeek ?? 6, status: me.availability?.status || "open", slots: me.availability?.slots || [],
    github: me.links?.github || "", linkedin: me.links?.linkedin || "", website: me.links?.website || "", public: !!me.visibility?.public, showRate: me.visibility?.showRate ?? true, showLocation: me.visibility?.showLocation ?? true, showAvailability: me.visibility?.showAvailability ?? true, showLinks: me.visibility?.showLinks ?? true,
  }));
  const set = <K extends keyof P>(k: K, v: P[K]) => setP((x) => ({ ...x, [k]: v }));
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  useEffect(() => {
    try {
      const g = sessionStorage.getItem("sk_goal"); if (g && (GOALS as readonly string[]).includes(g) && !p.goals.length) set("goals", [g as Goal]);
      if (!me.location) { const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; if (tz && me.timezone === "Asia/Kolkata" && !me.availability?.slots?.length) set("timezone", tz); }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const tzs = useMemo(() => { try { return (Intl as any).supportedValuesOf("timeZone") as string[]; } catch { return ["Asia/Kolkata", "UTC"]; } }, []);

  const payload = () => ({
    intents: p.intents, goals: p.goals, headline: p.headline, domain: p.domain as any, subdomain: p.subdomain, skills: p.skills, dayJob: p.dayJob, compensation: p.compensation,
    rate: p.rateMax ? { min: Number(p.rateMin || 0), max: Number(p.rateMax), currency: "INR", unit: p.rateUnit } : null,
    timezone: p.timezone, location: p.location, availability: { status: p.status, hoursPerWeek: p.hours, slots: p.slots },
    links: { github: p.github, linkedin: p.linkedin, website: p.website },
    visibility: { public: p.public, showRate: p.showRate, showLocation: p.showLocation, showAvailability: p.showAvailability, showLinks: p.showLinks },
  });
  async function save(partial?: boolean) {
    setBusy(true);
    try {
      const all = payload();
      const keys: Record<number, (keyof ReturnType<typeof payload>)[]> = { 0: ["intents", "goals"], 1: ["headline", "domain", "skills"], 2: ["dayJob", "compensation", "rate"], 3: ["timezone", "location", "availability"], 4: ["links"], 5: ["visibility"] };
      const body: any = {}; for (const k of keys[step]) body[k] = (all as any)[k];
      if (step === 5) Object.assign(body, all);
      await api.put("/api/me/profile", body);
      return true;
    } catch (e: any) { toast(e.message, "err"); return false; } finally { setBusy(false); }
  }
  async function next() {
    if (step === 0 && !p.intents.length) return toast("Pick at least one so we can tailor things.", "err");
    if (step === 1 && !p.skills.length) return toast("Add at least one skill to continue.", "err");
    if (!(await save())) return;
    if (step < STEPS.length - 1) setStep(step + 1); else { toast("You are all set.", "ok"); window.location.href = "/discover"; }
  }

  return (
    <div className="onb">
      <div className="onb-head"><span className="eyebrow">Step {step + 1} of {STEPS.length}: {STEPS[step]}</span><Link href="/discover" className="small">Skip for now</Link></div>
      <div className="steps-dots" aria-hidden>{STEPS.map((s, i) => <i key={s} className={i < step ? "done" : i === step ? "now" : ""} />)}</div>
      <div className="card card-pad mt-24 stack-lg">
        {step === 0 && <div className="stack">
          <div style={{ width: "min(240px, 60%)" }}><Illustration id="onboarding" /></div>
          <h1 className="h2">What brings you to Skilion?</h1><p className="muted">Pick everything that fits. You can change this any time.</p>
          <div className="grid grid-2">{INTENTS.map((i) => { const I = INTENT_INFO[i].icon; return <button type="button" key={i} className="option-card" aria-pressed={p.intents.includes(i)} onClick={() => set("intents", toggle(p.intents, i))}><I aria-hidden /><span><b>{INTENT_INFO[i].t}</b><br /><span className="muted small">{INTENT_INFO[i].d}</span></span></button>; })}</div>
          <h2 className="h3" style={{ marginTop: 8 }}>What do you like working on?</h2>
          <div className="grid grid-2">{GOALS.map((g) => { const I = GOAL_ICON[g]; return <button type="button" key={g} className="option-card" aria-pressed={p.goals.includes(g)} onClick={() => set("goals", toggle(p.goals, g))}><I aria-hidden /><b>{GOAL_LABEL[g]}</b></button>; })}</div>
        </div>}
        {step === 1 && <div className="stack">
          <h1 className="h2">What are you good at?</h1>
          <Field label="Headline" htmlFor="ob-head" help="One line, like “Embedded engineer who ships sensor products”."><input id="ob-head" className="input" maxLength={120} value={p.headline} onChange={(e) => set("headline", e.target.value)} /></Field>
          <Field label="Main area" htmlFor="ob-domain"><select id="ob-domain" className="select" value={p.domain} onChange={(e) => setP((x) => ({ ...x, domain: e.target.value, subdomain: "" }))}><option value="">Choose one</option>{DOMAINS.map((d) => <option key={d}>{d}</option>)}</select></Field>
          {subdomainsOf(p.domain).length > 0 && <Field label="Sub-area" optional htmlFor="ob-sub"><select id="ob-sub" className="select" value={p.subdomain} onChange={(e) => set("subdomain", e.target.value)}><option value="">Choose one</option>{subdomainsOf(p.domain).map((d) => <option key={d}>{d}</option>)}</select></Field>}
          <Field label="Skills" htmlFor="skills"><SkillPicker value={p.skills} onChange={(v) => set("skills", v)} domain={p.domain} subdomain={p.subdomain} /></Field>
        </div>}
        {step === 2 && <div className="stack">
          <h1 className="h2">How do you want to work with teams?</h1>
          <label className="check"><input type="checkbox" checked={p.dayJob} onChange={(e) => set("dayJob", e.target.checked)} /><span><b>I have a day job and build in my spare time</b><br /><span className="muted small">You get a “Builds after hours” marker. Teams then plan around your evenings and weekends.</span></span></label>
          <div><div className="label" style={{ marginBottom: 8 }}>What rewards work for you?</div><div className="chips">{COMPENSATION.map((c) => <button type="button" key={c} className="chip chip-line" aria-pressed={p.compensation.includes(c)} onClick={() => set("compensation", toggle(p.compensation, c))} style={p.compensation.includes(c) ? { background: "var(--ink)", color: "#fff" } : undefined}>{COMP_LABEL[c]}</button>)}</div><p className="help mt-8">Skilion does not hold money between teammates. You agree the terms directly.</p></div>
          <div className="grid grid-2"><Field label="Rate from (₹)" optional htmlFor="ob-r1"><input id="ob-r1" className="input" inputMode="numeric" value={p.rateMin} onChange={(e) => set("rateMin", e.target.value.replace(/\D/g, ""))} /></Field><Field label="Rate to (₹)" optional htmlFor="ob-r2"><input id="ob-r2" className="input" inputMode="numeric" value={p.rateMax} onChange={(e) => set("rateMax", e.target.value.replace(/\D/g, ""))} /></Field></div>
          <div className="seg" role="group" aria-label="Rate unit">{(["hour", "session"] as const).map((u) => <button key={u} type="button" aria-pressed={p.rateUnit === u} onClick={() => set("rateUnit", u)}>Per {u}</button>)}</div>
        </div>}
        {step === 3 && <div className="stack">
          <h1 className="h2">When are you free?</h1>
          <div className="grid grid-2"><Field label="Time zone" htmlFor="ob-tz"><select id="ob-tz" className="select" value={p.timezone} onChange={(e) => set("timezone", e.target.value)}>{tzs.map((t) => <option key={t}>{t}</option>)}</select></Field><Field label="Location" optional htmlFor="ob-loc"><input id="ob-loc" className="input" placeholder="City, country" value={p.location} onChange={(e) => set("location", e.target.value)} /></Field></div>
          <div className="grid grid-2"><Field label="Hours per week" htmlFor="ob-hrs"><input id="ob-hrs" className="input" type="number" min={0} max={60} value={p.hours} onChange={(e) => set("hours", Math.max(0, Math.min(60, Number(e.target.value) || 0)))} /></Field><Field label="Status" htmlFor="ob-st"><select id="ob-st" className="select" value={p.status} onChange={(e) => set("status", e.target.value as any)}><option value="open">Open to build</option><option value="busy">Limited time</option><option value="unavailable">Not available</option></select></Field></div>
          <AvailabilityGrid slots={p.slots} onChange={(s) => set("slots", s)} timezone={p.timezone} />
        </div>}
        {step === 4 && <div className="stack">
          <h1 className="h2">Where can people see your work?</h1><p className="muted">Optional. You can add full projects later in Settings, Proof of work.</p>
          <Field label="GitHub" optional htmlFor="ob-gh"><input id="ob-gh" className="input" placeholder="https://github.com/you" value={p.github} onChange={(e) => set("github", e.target.value)} /></Field>
          <Field label="LinkedIn" optional htmlFor="ob-li"><input id="ob-li" className="input" placeholder="https://linkedin.com/in/you" value={p.linkedin} onChange={(e) => set("linkedin", e.target.value)} /></Field>
          <Field label="Website or portfolio" optional htmlFor="ob-web"><input id="ob-web" className="input" placeholder="https://" value={p.website} onChange={(e) => set("website", e.target.value)} /></Field>
        </div>}
        {step === 5 && <div className="stack">
          <h1 className="h2">Review your privacy</h1>
          <label className="check"><input type="checkbox" checked={p.public} onChange={(e) => set("public", e.target.checked)} /><span><b>Make my profile public</b><br /><span className="muted small">Visitors and search engines can see it. Off by default. Signed-in members can find you either way.</span></span></label>
          <div className="stack-sm"><div className="label">Show members these details</div>
            {([["showLocation", "Location"], ["showRate", "Rate"], ["showAvailability", "Weekly hours"], ["showLinks", "Links"]] as const).map(([k, l]) => <label key={k} className="check"><input type="checkbox" checked={p[k]} onChange={(e) => set(k, e.target.checked)} />{l}</label>)}
          </div>
          <div className="alert alert-info">You can change all of this in Settings, Privacy. AI-assisted matching can be turned off there too.</div>
        </div>}
        <div className="row between">
          <button className="btn btn-ghost" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}>Back</button>
          <button className="btn btn-primary" onClick={next} disabled={busy}>{busy ? <span className="spinner" /> : step === STEPS.length - 1 ? "Finish" : "Continue"}</button>
        </div>
      </div>
    </div>
  );
}
