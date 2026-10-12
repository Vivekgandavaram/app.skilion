"use client";
import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Plus, Trash2, MessageSquare, ExternalLink } from "lucide-react";
import { api, fetcher, timeAgo } from "@/lib/client";
import { Avatar } from "@/components/ui";
import { Tabs, Field, Skeleton, ConfirmDialog, useToast, CopyButton } from "@/components/client-ui";
import { GOAL_LABEL, COMP_LABEL } from "@/lib/types";

type Tab = "overview" | "tasks" | "milestones" | "checkins" | "decisions" | "settings";

export default function Workspace({ id }: { id: string }) {
  const { toast } = useToast();
  const { data: d, mutate, isLoading, error } = useSWR(`/api/projects/${id}`, fetcher, { refreshInterval: 20000 });
  const [tab, setTab] = useState<Tab>("overview");
  const [summary, setSummary] = useState<any>(null);
  const [leave, setLeave] = useState(false);
  if (isLoading) return <Skeleton h={300} />;
  if (error || !d) return <div className="alert alert-warn">{error?.message || "Project not found."}</div>;
  const p = d.project;
  const act = async (fn: () => Promise<any>, ok?: string) => { try { await fn(); await mutate(); if (ok) toast(ok, "ok"); } catch (e: any) { toast(e.message, "err"); } };
  const add = (b: any, ok?: string) => act(() => api.post(`/api/projects/${id}/items`, b), ok);
  const open = d.tasks.filter((t: any) => t.status !== "done").length;

  return (
    <div className="stack-lg">
      <div className="card card-pad stack">
        <div className="row between" style={{ flexWrap: "wrap" }}>
          <div className="stack-sm"><div className="chips"><span className="chip chip-evidence">{GOAL_LABEL[p.goal as keyof typeof GOAL_LABEL]}</span><span className="chip chip-line">{p.status}</span>{p.compensation.map((c: string) => <span key={c} className="chip chip-line">{COMP_LABEL[c as keyof typeof COMP_LABEL]}</span>)}</div>
            <h2 className="h2">{p.title}</h2><p className="muted" style={{ maxWidth: 640 }}>{p.summary}</p></div>
          <div className="row">{p.convId && <Link className="btn btn-primary" href={`/messages?c=${p.convId}`}><MessageSquare aria-hidden />Squad chat</Link>}</div>
        </div>
        <div className="row small muted" style={{ gap: 18, flexWrap: "wrap" }}><span className="tnum">{d.members.length} members</span><span className="tnum">{open} open tasks</span><span className="tnum">{d.hoursThisWeek} h logged this week</span>{d.isOwner && d.pendingInvites > 0 && <span>{d.pendingInvites} invitations pending</span>}</div>
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "overview", label: "Overview" }, { value: "tasks", label: "Tasks" }, { value: "milestones", label: "Milestones" }, { value: "checkins", label: "Check-ins" }, { value: "decisions", label: "Decisions" }, { value: "settings", label: d.isOwner ? "Settings" : "My settings" }]} />

      {tab === "overview" && (
        <div className="two-col"><div className="stack-lg">
          <section className="card card-pad stack-sm"><div className="row between"><h3 className="h3">Progress summary</h3><button className="btn btn-soft btn-sm" onClick={async () => { try { setSummary(await api.post(`/api/projects/${id}/summary`)); } catch (e: any) { toast(e.message, "err"); } }}>Summarise</button></div>
            {summary ? <><ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{summary.facts.map((f: string) => <li key={f}>{f}</li>)}</ul>{summary.ai && <div className="alert alert-info"><span><b>AI note:</b> {summary.ai}</span></div>}{!summary.aiAvailable && <p className="xs muted">An AI-written note is part of Founder Pro.</p>}</> : <p className="small muted">A plain roll-up of tasks, milestones, check-ins and decisions.</p>}</section>
          {p.objectives.length > 0 && <section className="card card-pad stack-sm"><h3 className="h3">Objectives</h3><ul style={{ margin: 0, paddingLeft: 18 }}>{p.objectives.map((o: string) => <li key={o}>{o}</li>)}</ul></section>}
          <section className="card card-pad stack-sm"><h3 className="h3">Links</h3>{p.links.length === 0 && <p className="small muted">No links yet. Add a repo, design file or doc in Settings.</p>}{p.links.map((l: any) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer nofollow"><ExternalLink size={13} aria-hidden /> {l.title}</a>)}</section>
          <section className="card card-pad stack-sm"><h3 className="h3">Activity</h3>{d.activity.length === 0 && <p className="small muted">Nothing yet.</p>}{d.activity.map((a: any) => <div key={a.id} className="small"><b>{a.person?.name || "Someone"}</b> {a.text} <span className="xs muted">· {timeAgo(a.createdAt)}</span></div>)}</section>
        </div>
        <aside className="card card-pad stack sticky-side"><h3 className="h4">Members</h3>{d.members.map((m: any) => <div key={m.userId} className="row-nowrap"><Avatar name={m.person?.name || "?"} image={m.person?.image} /><div style={{ minWidth: 0 }}><Link href={`/u/${m.person?.handle}`} style={{ fontWeight: 700, color: "inherit" }}>{m.person?.name}</Link><div className="xs muted">{m.roleTitle}{m.hoursPerWeek ? ` · ${m.hoursPerWeek} h/wk` : ""}</div></div></div>)}
          {d.isOwner && <Link className="btn btn-ghost btn-sm" href="/team">Invite more from a cart</Link>}</aside></div>
      )}

      {tab === "tasks" && <Tasks d={d} add={add} act={act} id={id} />}

      {tab === "milestones" && (
        <div className="stack"><AddLine label="New milestone" onAdd={(t) => add({ kind: "milestone", title: t })} />
          {d.milestones.map((m: any) => { const n = d.tasks.filter((t: any) => t.milestoneId === m.id); const dn = n.filter((t: any) => t.status === "done").length;
            return <div key={m.id} className="card card-pad-sm row between"><label className="check"><input type="checkbox" checked={m.done} onChange={(e) => act(() => api.patch(`/api/projects/${id}/items`, { kind: "milestone", id: m.id, done: e.target.checked }))} /><span><b style={{ textDecoration: m.done ? "line-through" : undefined }}>{m.title}</b>{m.due && <span className="small muted"> · due {new Date(m.due).toLocaleDateString("en-IN")}</span>}{n.length > 0 && <span className="small muted"> · {dn}/{n.length} tasks</span>}</span></label><button className="icon-btn" aria-label="Delete milestone" onClick={() => act(() => api.del(`/api/projects/${id}/items`, { kind: "milestone", id: m.id }))}><Trash2 size={15} aria-hidden /></button></div>; })}
          {!d.milestones.length && <p className="small muted">Milestones are the checkpoints between now and done. Keep them to one clear outcome each.</p>}</div>
      )}

      {tab === "checkins" && <CheckIns d={d} add={add} />}

      {tab === "decisions" && (
        <div className="stack"><AddLine label="Record a decision" onAdd={(t) => add({ kind: "decision", text: t })} />
          {d.decisions.map((x: any) => <div key={x.id} className="card card-pad-sm"><div className="small muted">{x.person?.name} · {timeAgo(x.createdAt)}</div><p style={{ margin: "4px 0 0" }}>{x.text}</p></div>)}
          {!d.decisions.length && <p className="small muted">Write down what the team decided and why. It saves arguments later.</p>}</div>
      )}

      {tab === "settings" && <Settings d={d} id={id} act={act} onLeave={() => setLeave(true)} />}
      <ConfirmDialog open={leave} onClose={() => setLeave(false)} title="Leave this project?" body="Your tasks become unassigned and you leave the squad chat." confirmLabel="Leave" danger onConfirm={async () => { try { await api.del(`/api/projects/${id}/members`, {}); location.href = "/projects"; } catch (e: any) { toast(e.message, "err"); } }} />
    </div>
  );
}

function AddLine({ label, onAdd }: { label: string; onAdd: (t: string) => void }) {
  const [t, setT] = useState("");
  return <form className="row-nowrap" onSubmit={(e) => { e.preventDefault(); if (t.trim()) { onAdd(t.trim()); setT(""); } }}><label className="sr-only" htmlFor={`add-${label}`}>{label}</label><input id={`add-${label}`} className="input" placeholder={label} value={t} maxLength={600} onChange={(e) => setT(e.target.value)} /><button className="btn btn-dark" disabled={!t.trim()}><Plus aria-hidden />Add</button></form>;
}

function Tasks({ d, add, act, id }: any) {
  const cols = [["todo", "To do"], ["doing", "In progress"], ["done", "Done"]] as const;
  const [ms, setMs] = useState("");
  return (
    <div className="stack">
      <div className="row-nowrap"><AddLineWrap onAdd={(t) => add({ kind: "task", title: t, milestoneId: ms || undefined })} />
        {d.milestones.length > 0 && <select className="select" style={{ maxWidth: 200 }} aria-label="Milestone for new task" value={ms} onChange={(e) => setMs(e.target.value)}><option value="">No milestone</option>{d.milestones.map((m: any) => <option key={m.id} value={m.id}>{m.title}</option>)}</select>}</div>
      <div className="board">{cols.map(([k, label]) => (
        <section key={k} className="stack-sm" aria-label={label}><h3 className="h4">{label} <span className="muted tnum">{d.tasks.filter((t: any) => t.status === k).length}</span></h3>
          {d.tasks.filter((t: any) => t.status === k).map((t: any) => (
            <div key={t.id} className="task"><b className="small">{t.title}</b>
              <div className="row" style={{ gap: 6 }}>
                <select className="select" style={{ minHeight: 34, padding: "4px 8px", width: "auto" }} aria-label="Assignee" value={t.assigneeId || ""} onChange={(e) => act(() => api.patch(`/api/projects/${id}/items`, { kind: "task", id: t.id, assigneeId: e.target.value || null }))}><option value="">Unassigned</option>{d.members.map((m: any) => <option key={m.userId} value={m.userId}>{m.person?.name}</option>)}</select>
                <select className="select" style={{ minHeight: 34, padding: "4px 8px", width: "auto" }} aria-label="Status" value={t.status} onChange={(e) => act(() => api.patch(`/api/projects/${id}/items`, { kind: "task", id: t.id, status: e.target.value }))}>{cols.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                <button className="icon-btn" aria-label="Delete task" onClick={() => act(() => api.del(`/api/projects/${id}/items`, { kind: "task", id: t.id }))}><Trash2 size={14} aria-hidden /></button></div></div>))}
        </section>))}</div>
    </div>
  );
}
function AddLineWrap({ onAdd }: { onAdd: (t: string) => void }) { return <div style={{ flex: 1 }}><AddLine label="New task" onAdd={onAdd} /></div>; }

function CheckIns({ d, add }: any) {
  const [text, setText] = useState(""); const [h, setH] = useState("2");
  return (
    <div className="stack">
      <form className="card card-pad stack-sm" onSubmit={(e) => { e.preventDefault(); add({ kind: "checkin", text, hours: Number(h) || 0 }, "Checked in."); setText(""); }}>
        <Field label="What did you do, and what is blocking you?" htmlFor="ci-t"><textarea id="ci-t" className="textarea" rows={3} maxLength={600} value={text} onChange={(e) => setText(e.target.value)} /></Field>
        <div className="row"><Field label="Hours" htmlFor="ci-h"><input id="ci-h" className="input" type="number" min={0} max={80} step={0.5} style={{ width: 100 }} value={h} onChange={(e) => setH(e.target.value)} /></Field><button className="btn btn-primary" disabled={text.trim().length < 3} style={{ alignSelf: "end" }}>Check in</button></div></form>
      {d.checkins.map((c: any) => <div key={c.id} className="card card-pad-sm"><div className="row between small"><b>{c.person?.name}</b><span className="muted tnum">{c.hours} h · {timeAgo(c.createdAt)}</span></div><p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{c.text}</p></div>)}
    </div>
  );
}

function Settings({ d, id, act, onLeave }: any) {
  const p = d.project; const { toast } = useToast();
  const me = d.members.find((m: any) => m.userId === d.meId);
  const [f, setF] = useState({ title: p.title, summary: p.summary, status: p.status, objectives: p.objectives.join("\n"), links: p.links.map((l: any) => `${l.title} | ${l.url}`).join("\n") });
  const [outcome, setOutcome] = useState(p.showcase.outcome || "");
  const save = () => {
    const links = String(f.links).split("\n").map((l: string) => l.trim()).filter(Boolean).map((l: string) => { const [t, ...u] = l.split("|"); return { title: (u.length ? t : l).trim().slice(0, 60), url: (u.length ? u.join("|") : l).trim() }; });
    act(() => api.patch(`/api/projects/${id}`, { title: f.title, summary: f.summary, status: f.status, objectives: String(f.objectives).split("\n").map((s: string) => s.trim()).filter(Boolean), links }), "Saved.");
  };
  return (
    <div className="stack-lg">
      <section className="card card-pad stack"><h3 className="h3">My listing</h3>
        <label className="check"><input type="checkbox" checked={!!me?.contributionConsent} onChange={(e) => act(() => api.patch(`/api/projects/${id}/members`, { contributionConsent: e.target.checked }))} /><span><b>Name me as a contributor if this project is published</b><span className="small muted" style={{ display: "block" }}>Off by default. You are never listed publicly without saying yes.</span></span></label>
        {!d.isOwner && <div><button className="btn btn-ghost btn-sm" onClick={onLeave}>Leave project</button></div>}</section>
      {d.isOwner && (<>
        <section className="card card-pad stack"><h3 className="h3">Project details</h3>
          <Field label="Title" htmlFor="ps-t"><input id="ps-t" className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Summary" htmlFor="ps-s"><textarea id="ps-s" className="textarea" rows={3} value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} /></Field>
          <Field label="Status" htmlFor="ps-st"><select id="ps-st" className="select" style={{ maxWidth: 220 }} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="recruiting">Recruiting</option><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option></select></Field>
          <Field label="Objectives" help="One per line" htmlFor="ps-o"><textarea id="ps-o" className="textarea" rows={3} value={f.objectives} onChange={(e) => setF({ ...f, objectives: e.target.value })} /></Field>
          <Field label="Links" help="One per line: Title | https://..." htmlFor="ps-l"><textarea id="ps-l" className="textarea" rows={3} value={f.links} onChange={(e) => setF({ ...f, links: e.target.value })} /></Field>
          <div><button className="btn btn-primary" onClick={save}>Save</button></div></section>
        <section className="card card-pad stack"><h3 className="h3">Members</h3>{d.members.filter((m: any) => m.userId !== d.meId).map((m: any) => <div key={m.userId} className="row between"><span>{m.person?.name} <span className="muted small">· {m.roleTitle}</span></span><button className="btn btn-ghost btn-sm" onClick={() => confirm(`Remove ${m.person?.name}?`) && act(() => api.del(`/api/projects/${id}/members`, { userId: m.userId }), "Removed.")}>Remove</button></div>)}{d.members.length < 2 && <p className="small muted">Just you so far.</p>}</section>
        <section className="card card-pad stack"><h3 className="h3">Public showcase</h3><p className="small muted">Publish what you finished. Only the title, summary, objectives, outcome and members who said yes appear. Tasks, chat and check-ins stay private.</p>
          <Field label="Outcome" htmlFor="sc-o" help="What happened? Only things that are true."><textarea id="sc-o" className="textarea" rows={3} maxLength={600} value={outcome} onChange={(e) => setOutcome(e.target.value)} /></Field>
          <div className="row">{p.showcase.enabled ? <><button className="btn btn-ghost" onClick={() => act(() => api.post(`/api/projects/${id}/showcase`, { enabled: false }), "Unpublished.")}>Unpublish</button><a className="btn btn-soft" href={`/showcase/${p.showcase.slug}`} target="_blank" rel="noopener">View page</a><CopyButton text={`${location.origin}/showcase/${p.showcase.slug}`} /></> : <button className="btn btn-primary" disabled={outcome.trim().length < 10} onClick={() => act(() => api.post(`/api/projects/${id}/showcase`, { enabled: true, outcome }), "Published.")}>Publish to showcase</button>}</div></section>
      </>)}
    </div>
  );
}
