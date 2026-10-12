"use client";
import { useEffect, useState } from "react";
import { Link2, Send } from "lucide-react";
import { api } from "@/lib/client";
import { Field, Segmented, useToast, useDebounced } from "@/components/client-ui";
import SkillPicker from "@/components/SkillPicker";
import { GOALS, GOAL_LABEL, COMPENSATION, COMP_LABEL } from "@/lib/types";

const TYPES = [
  { value: "opportunity", label: "Looking for people" },
  { value: "update", label: "Update" },
  { value: "project", label: "Project" },
  { value: "demo", label: "Demo" },
  { value: "article", label: "Article" },
] as const;
type T = (typeof TYPES)[number]["value"];

export default function Composer({ emailVerified, onPosted, works }: { emailVerified: boolean; onPosted: () => void; works: { id: string; title: string }[] }) {
  const { toast } = useToast();
  const [type, setType] = useState<T>("opportunity");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [workId, setWorkId] = useState("");
  const [goal, setGoal] = useState<(typeof GOALS)[number]>("validate");
  const [comp, setComp] = useState<string[]>(["equity"]);
  const [skills, setSkills] = useState<string[]>([]);
  const [hours, setHours] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [prev, setPrev] = useState<any>(null);
  const du = useDebounced(url, 600);
  useEffect(() => {
    let off = false;
    if (!/^https:\/\/.+\..+/.test(du)) { setPrev(null); return; }
    api.post("/api/preview", { url: du }).then((j) => !off && setPrev(j.preview)).catch(() => !off && setPrev(null));
    return () => { off = true; };
  }, [du]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/api/posts", {
        type, text, url: url || undefined, workId: workId || undefined,
        tags: tags.split(/[ ,]+/).filter(Boolean).slice(0, 5),
        ...(type === "opportunity" ? { opp: { goal, compensation: comp, skillsNeeded: skills, hoursPerWeek: hours ? Number(hours) : undefined } } : {}),
      });
      setText(""); setUrl(""); setTags(""); setSkills([]); setPrev(null); setWorkId("");
      toast("Posted.", "ok"); setOpen(false); onPosted();
    } catch (e: any) { toast(e.message, "err"); } finally { setBusy(false); }
  }
  if (!emailVerified) return <div className="alert alert-warn">Verify your email to post. <a href="/verify">Verify now</a></div>;
  if (!open) return (
    <div className="card composer-collapsed">
      <button type="button" className="composer-prompt" onClick={() => setOpen(true)}>Post what you are building and who you need</button>
      <div className="row" style={{ gap: 6 }}>{TYPES.slice(0, 3).map((t) => <button key={t.value} type="button" className="chip chip-line" onClick={() => { setType(t.value); setOpen(true); }}>{t.label}</button>)}</div>
    </div>
  );
  return (
    <form className="card card-pad stack" onSubmit={submit} aria-label="Create a post">
      <div className="row between"><b>New post</b><button type="button" className="link-btn small" style={{ textDecoration: "none", color: "var(--slate)" }} onClick={() => setOpen(false)}>Close</button></div>
      <Segmented label="Post type" value={type} onChange={setType} options={TYPES.map((t) => ({ value: t.value, label: t.label }))} />
      <Field label={type === "opportunity" ? "What are you trying to do, and who do you need?" : "What do you want to share?"} htmlFor="post-text">
        <textarea id="post-text" autoFocus className="textarea" rows={type === "opportunity" ? 4 : 3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)}
          placeholder={type === "opportunity" ? "I am testing a booking tool for yoga studios. I need a designer for two weekends to turn my sketches into a clickable prototype." : "Share progress, a demo or something you learned."} />
      </Field>
      {type === "opportunity" && (
        <div className="stack">
          <Field label="Goal"><Segmented label="Goal" value={goal} onChange={setGoal} options={GOALS.map((g) => ({ value: g, label: GOAL_LABEL[g] }))} /></Field>
          <Field label="How will people be rewarded?" help="Be honest. People decide based on this.">
            <div className="chips">{COMPENSATION.map((c) => <button type="button" key={c} className={`chip ${comp.includes(c) ? "chip-evidence" : ""}`} aria-pressed={comp.includes(c)} onClick={() => setComp(comp.includes(c) ? comp.filter((x) => x !== c) : [...comp, c])}>{COMP_LABEL[c]}</button>)}</div>
          </Field>
          <Field label="Skills you need"><SkillPicker value={skills} onChange={setSkills} max={8} id="opp-skills" /></Field>
          <Field label="Hours per week" optional htmlFor="opp-hours"><input id="opp-hours" className="input" type="number" min={1} max={40} value={hours} onChange={(e) => setHours(e.target.value)} style={{ maxWidth: 140 }} /></Field>
        </div>
      )}
      <details className="small"><summary style={{ cursor: "pointer", fontWeight: 600 }}>Add a link, tags or a project</summary><div className="stack" style={{ marginTop: 12 }}>
      <div className="grid grid-2">
        <Field label="Link" optional htmlFor="post-url"><div className="row-nowrap"><Link2 size={18} aria-hidden color="var(--slate)" /><input id="post-url" className="input" type="url" inputMode="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} /></div></Field>
        <Field label="Tags" optional help="Up to five, separated by spaces" htmlFor="post-tags"><input id="post-tags" className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="iot design" /></Field>
      </div>
      {prev && <div className="link-card" aria-label="Link preview"><div className="thumb" style={prev.image ? { backgroundImage: `url(${prev.image})` } : undefined} /><div className="meta"><span className="xs muted">{prev.siteName}</span><b className="clamp-2">{prev.title}</b>{prev.description && <span className="small muted clamp-2">{prev.description}</span>}</div></div>}
      {works.length > 0 && <Field label="Attach a project from your profile" optional htmlFor="post-work"><select id="post-work" className="select" value={workId} onChange={(e) => setWorkId(e.target.value)}><option value="">None</option>{works.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}</select></Field>}
      </div></details>
      <div className="row between"><span className="xs muted tnum">{text.length}/2000</span><button className="btn btn-primary" disabled={busy || text.trim().length < 3}>{busy ? <span className="spinner" /> : <><Send aria-hidden />Post</>}</button></div>
    </form>
  );
}
