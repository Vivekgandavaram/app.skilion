"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, Trash2, ShoppingBag, Save, Info } from "lucide-react";
import { api } from "@/lib/client";
import { Field, Segmented, useToast } from "@/components/client-ui";
import SkillPicker from "@/components/SkillPicker";
import RoleMatches from "./RoleMatches";
import { GOALS, GOAL_LABEL, COMPENSATION, COMP_LABEL, type Goal } from "@/lib/types";

const GOAL_COPY: Record<Goal, string> = {
  validate: "Find out if people want it, before you build it. Research, a concept and a few real conversations.",
  prototype: "Make a thin, working version people can try. Small team, short cycle.",
  help: "Get one scoped thing done: a review, a fix, a second pair of eyes.",
  company: "Find co-founders and early teammates for something you plan to run for years.",
};
const STAGES = [{ value: "idea", label: "Just an idea" }, { value: "validating", label: "Validating" }, { value: "prototype", label: "Have a prototype" }, { value: "launched", label: "Launched" }] as const;

type Role = { key: string; title: string; responsibilities: string[]; essentialSkills: string[]; optionalSkills: string[]; hoursPerWeek: number; budgetShare: number };
type Out = { summary: string; assumptions: string[]; scope: string; roles: Role[]; milestones: { title: string; weeks: number; outcome: string }[]; risks: string[]; questions: string[] };

export default function BuildClient({ goalArt, initialId, aiLeft }: { goalArt: Record<string, React.ReactNode>; initialId?: string; aiLeft: { remaining: number; limit: number } }) {
  const r = useRouter(); const { toast } = useToast();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [f, setF] = useState({ vision: "", problem: "", audience: "", outcome: "", stage: "idea" as (typeof STAGES)[number]["value"], budget: "", timeline: "" });
  const [comp, setComp] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ id: string; output: Out; source: string; note?: string; goal: Goal; budget?: number } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [left, setLeft] = useState(aiLeft);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (!initialId) return;
    api.get(`/api/blueprints/${initialId}`).then((b) => { setRes({ id: b.id, output: b.output, source: b.source, goal: b.input.goal, budget: b.input.budget }); setGoal(b.input.goal); }).catch(() => {});
  }, [initialId]);

  async function generate(e: React.FormEvent) {
    e.preventDefault(); if (!goal) return;
    setBusy(true);
    try {
      const j = await api.post("/api/ai/blueprint", { ...f, goal, budget: f.budget ? Number(f.budget) : undefined, compensation: comp, problem: f.problem || undefined, audience: f.audience || undefined, outcome: f.outcome || undefined, timeline: f.timeline || undefined });
      setRes({ id: j.id, output: j.output, source: j.source, note: j.note, goal, budget: f.budget ? Number(f.budget) : undefined });
      setLeft({ remaining: j.ai.remaining, limit: j.ai.limit }); setDirty(false);
      setTimeout(() => document.getElementById("plan")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e: any) { toast(e.message, "err"); } finally { setBusy(false); }
  }
  const out = res?.output;
  const edit = (fn: (o: Out) => Out) => { if (!res) return; setRes({ ...res, output: fn(structuredClone(res.output)) }); setDirty(true); };
  async function save() { if (!res) return; try { await api.patch(`/api/blueprints/${res.id}`, { output: res.output }); setDirty(false); toast("Plan saved.", "ok"); } catch (e: any) { toast(e.message, "err"); } }
  async function toCart() {
    if (!res) return;
    try { if (dirty) await save(); const j = await api.post(`/api/blueprints/${res.id}/to-cart`); r.push(`/team/${j.id}`); } catch (e: any) { toast(e.message, "err"); }
  }
  const share = out ? Math.round(out.roles.reduce((a, x) => a + x.budgetShare, 0) * 100) : 0;

  return (
    <div className="stack-lg">
      <section aria-labelledby="goal-h" className="stack">
        <h2 className="h3" id="goal-h">1. What do you want to do?</h2>
        <div className="grid grid-4">
          {GOALS.map((g) => (
            <button key={g} type="button" className="card goal-card card-hover" style={{ textAlign: "left", cursor: "pointer", outline: goal === g ? "3px solid var(--blue)" : undefined }} aria-pressed={goal === g} onClick={() => setGoal(g)}>
              {goalArt[g]}
              <div className="stack-sm" style={{ padding: "0 16px 16px" }}><b>{GOAL_LABEL[g]}</b><span className="small muted">{GOAL_COPY[g]}</span></div>
            </button>
          ))}
        </div>
      </section>

      {goal && (
        <form className="card card-pad stack" onSubmit={generate} aria-labelledby="idea-h">
          <h2 className="h3" id="idea-h">2. Tell us about it</h2>
          <Field label="What do you want to make happen?" htmlFor="b-vision" help="Plain words are best. Who is it for, and what changes for them?"><textarea id="b-vision" className="textarea" rows={4} required minLength={20} maxLength={1500} value={f.vision} onChange={set("vision")} placeholder="A simple booking tool for small yoga studios that replaces WhatsApp group chaos." /></Field>
          <div className="grid grid-2">
            <Field label="The problem" optional htmlFor="b-problem"><textarea id="b-problem" className="textarea" rows={2} maxLength={800} value={f.problem} onChange={set("problem")} /></Field>
            <Field label="Who is it for?" optional htmlFor="b-aud"><textarea id="b-aud" className="textarea" rows={2} maxLength={400} value={f.audience} onChange={set("audience")} /></Field>
          </div>
          <Field label="What would a good first outcome look like?" optional htmlFor="b-out"><input id="b-out" className="input" maxLength={400} value={f.outcome} onChange={set("outcome")} placeholder="Five studios say they would pay" /></Field>
          <Field label="Where are you now?"><Segmented label="Stage" value={f.stage} onChange={(v) => setF({ ...f, stage: v })} options={STAGES.map((s) => ({ value: s.value, label: s.label }))} /></Field>
          <div className="grid grid-2">
            <Field label="Budget in ₹" optional htmlFor="b-budget" help="Leave blank if rewards are equity, revenue share or learning."><input id="b-budget" className="input" inputMode="numeric" type="number" min={0} value={f.budget} onChange={set("budget")} /></Field>
            <Field label="Timeline" optional htmlFor="b-time"><input id="b-time" className="input" maxLength={60} value={f.timeline} onChange={set("timeline")} placeholder="4 weeks, evenings and weekends" /></Field>
          </div>
          <Field label="How could people be rewarded?" help="Pick any that you are open to. Be honest.">
            <div className="chips">{COMPENSATION.map((c) => <button type="button" key={c} className={`chip ${comp.includes(c) ? "chip-evidence" : ""}`} aria-pressed={comp.includes(c)} onClick={() => setComp(comp.includes(c) ? comp.filter((x) => x !== c) : [...comp, c])}>{COMP_LABEL[c]}</button>)}</div>
          </Field>
          <div className="row between" style={{ flexWrap: "wrap" }}>
            <span className="xs muted"><Info size={13} aria-hidden style={{ verticalAlign: -2 }} /> {left.remaining} of {left.limit} AI plans left this month. AI drafts, you decide.</span>
            <button className="btn btn-primary btn-lg" disabled={busy || f.vision.trim().length < 20}>{busy ? <><span className="spinner" /> Drafting your squad plan</> : <><Sparkles aria-hidden />Draft my squad plan</>}</button>
          </div>
        </form>
      )}

      {out && res && (
        <section id="plan" className="stack-lg" aria-labelledby="plan-h">
          <div className="stack-sm">
            <h2 className="h2" id="plan-h">Your squad plan</h2>
            <div className="alert alert-info"><span>{res.source === "gemini" ? "Drafted by AI from what you wrote." : "Template plan."} {res.note} It is a starting point: edit anything below. Nobody is contacted until you invite them.</span></div>
          </div>
          <div className="card card-pad stack-sm"><h3 className="h3">Summary</h3><p>{out.summary}</p><p className="small muted">{out.scope}</p></div>
          <div className="stack">
            <div className="row between"><h3 className="h3">Roles</h3>{res.budget ? <span className="small muted tnum">Budget ₹{res.budget.toLocaleString("en-IN")} · shares total {share}%</span> : null}</div>
            {out.roles.map((role, i) => (
              <div key={role.key} className="card card-pad stack">
                <div className="row between"><input className="input" style={{ fontWeight: 700, maxWidth: 360 }} aria-label="Role title" value={role.title} onChange={(e) => edit((o) => { o.roles[i].title = e.target.value; return o; })} />
                  <button className="icon-btn" aria-label={`Remove ${role.title}`} onClick={() => edit((o) => { o.roles.splice(i, 1); return o; })} disabled={out.roles.length < 2}><Trash2 size={16} aria-hidden /></button></div>
                <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{role.responsibilities.map((x, k) => <li key={k}>{x}</li>)}</ul>
                <div className="grid grid-2">
                  <Field label="Essential skills"><SkillPicker id={`es-${i}`} value={role.essentialSkills} max={6} onChange={(v) => edit((o) => { o.roles[i].essentialSkills = v; return o; })} /></Field>
                  <Field label="Nice to have"><SkillPicker id={`os-${i}`} value={role.optionalSkills} max={6} onChange={(v) => edit((o) => { o.roles[i].optionalSkills = v; return o; })} /></Field>
                </div>
                <div className="row">
                  <Field label="Hours per week" htmlFor={`h-${i}`}><input id={`h-${i}`} className="input" type="number" min={1} max={40} style={{ width: 110 }} value={role.hoursPerWeek} onChange={(e) => edit((o) => { o.roles[i].hoursPerWeek = Math.max(1, Math.min(40, Number(e.target.value) || 1)); return o; })} /></Field>
                  {res.budget ? <Field label="Budget share %" htmlFor={`s-${i}`}><input id={`s-${i}`} className="input" type="number" min={0} max={100} style={{ width: 110 }} value={Math.round(role.budgetShare * 100)} onChange={(e) => edit((o) => { o.roles[i].budgetShare = Math.max(0, Math.min(1, (Number(e.target.value) || 0) / 100)); return o; })} /></Field> : null}
                </div>
                <details><summary style={{ cursor: "pointer", fontWeight: 600 }}>Suggested people for this role</summary><div style={{ marginTop: 12 }}><RoleMatches role={role} /></div></details>
              </div>
            ))}
            {out.roles.length < 8 && <button className="btn btn-ghost btn-sm" style={{ justifySelf: "start" }} onClick={() => edit((o) => { o.roles.push({ key: `role-${o.roles.length + 1}-${Date.now() % 1000}`, title: "New role", responsibilities: [], essentialSkills: [], optionalSkills: [], hoursPerWeek: 4, budgetShare: 0 }); return o; })}><Plus aria-hidden />Add a role</button>}
          </div>
          <div className="grid grid-2">
            <div className="card card-pad stack-sm"><h3 className="h3">Milestones</h3><ol style={{ margin: 0, paddingLeft: 18 }} className="stack-sm">{out.milestones.map((m, i) => <li key={i}><b>{m.title}</b> <span className="muted tnum">· week {m.weeks}</span><div className="small muted">{m.outcome}</div></li>)}</ol></div>
            <div className="card card-pad stack"><div className="stack-sm"><h3 className="h3">Assumptions</h3><ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{out.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
              <div className="stack-sm"><h3 className="h3">Risks</h3><ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{out.risks.map((a, i) => <li key={i}>{a}</li>)}</ul></div></div>
          </div>
          {out.questions.length > 0 && <div className="card card-ice card-pad stack-sm"><h3 className="h3">Questions to answer before you start</h3><ul style={{ margin: 0, paddingLeft: 18 }}>{out.questions.map((q, i) => <li key={i}>{q}</li>)}</ul></div>}
          <div className="row" style={{ position: "sticky", bottom: 12, background: "rgba(255,255,255,.92)", backdropFilter: "blur(10px)", padding: 12, borderRadius: 16, border: "1px solid var(--line)" }}>
            <button className="btn btn-ghost" onClick={save} disabled={!dirty}><Save aria-hidden />{dirty ? "Save edits" : "Saved"}</button>
            <button className="btn btn-primary" onClick={toCart}><ShoppingBag aria-hidden />Create my Squad Cart</button>
          </div>
        </section>
      )}
    </div>
  );
}
