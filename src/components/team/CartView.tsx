"use client";
import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Trash2, Link2, Send, Check, X, Lock } from "lucide-react";
import { api, fetcher } from "@/lib/client";
import { Avatar, SkillChip, VerifyBadges, AvailabilityDot } from "@/components/ui";
import { Field, Modal, Skeleton, CopyButton, useToast } from "@/components/client-ui";
import RoleMatches from "@/components/build/RoleMatches";
import { COMPENSATION, COMP_LABEL, GOAL_LABEL } from "@/lib/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Heatmap({ grid, max }: { grid: number[][]; max: number }) {
  const lvl = (n: number) => (n === 0 ? "" : n >= max ? "l4" : n / max > 0.66 ? "l3" : n / max > 0.33 ? "l2" : "l1");
  return (
    <div className="heat-wrap"><div className="heat" role="img" aria-label="When people on this team are free, by hour of the week, in your time zone">
      <span />{Array.from({ length: 24 }, (_, h) => <span key={h} className="hdr">{h % 3 === 0 ? h : ""}</span>)}
      {grid.map((row, d) => [<span key={`d${d}`} className="day">{DAYS[d]}</span>, ...row.map((n, h) => <span key={`${d}-${h}`} className={`cell ${lvl(n)}`} title={`${DAYS[d]} ${h}:00, ${n} of ${max} free`} />)])}
    </div></div>
  );
}

export default function CartView({ id }: { id: string }) {
  const { toast } = useToast();
  const { data, mutate, isLoading, error } = useSWR(`/api/carts/${id}`, fetcher);
  const [invite, setInvite] = useState(false);
  const [iv, setIv] = useState({ title: "", summary: "", message: "" }); const [comp, setComp] = useState<string[]>(["equity"]); const [busy, setBusy] = useState(false);
  const [cmp, setCmp] = useState<string[]>([]);
  const [match, setMatch] = useState<string | null>(null);
  if (isLoading) return <Skeleton h={300} />;
  if (error || !data) return <div className="alert alert-warn">{error?.message || "Cart not found."}</div>;
  const c = data.cart;
  const patch = async (b: any) => { try { await api.patch(`/api/carts/${id}`, b); mutate(); } catch (e: any) { toast(e.message, "err"); } };
  const move = async (userId: string, from: string, to: string) => { try { await api.patch(`/api/carts/${id}/items`, { userId, from, to }); mutate(); } catch (e: any) { toast(e.message, "err"); } };
  const remove = async (userId: string, roleKey: string) => { try { await api.del(`/api/carts/${id}/items`, { userId, roleKey }); mutate(); } catch (e: any) { toast(e.message, "err"); } };
  async function advisor(on: boolean) { try { if (on) await api.post(`/api/carts/${id}/advisor`); else await api.del(`/api/carts/${id}/advisor`); mutate(); } catch (e: any) { toast(e.message, "err"); } }
  async function sendInvites() {
    setBusy(true);
    try { const j = await api.post(`/api/carts/${id}/invite`, { ...iv, compensation: comp, goal: c.goal || undefined }); toast(`${j.sent} invitation${j.sent === 1 ? "" : "s"} sent.`, "ok"); location.href = `/projects/${j.projectId}`; }
    catch (e: any) { toast(e.message, "err"); setBusy(false); }
  }
  const itemsBy = (key: string) => data.items.filter((i: any) => i.roleKey === key);
  const unassigned = itemsBy("unassigned");
  const compared = data.items.filter((i: any, k: number, a: any[]) => cmp.includes(i.person.id) && a.findIndex((x) => x.person.id === i.person.id) === k);
  const Person = ({ it }: { it: any }) => (
    <div className="card card-pad-sm stack-sm">
      <div className="row-nowrap"><Avatar name={it.person.name} image={it.person.image} /><div className="grow" style={{ minWidth: 0 }}><Link href={`/u/${it.person.handle}`} className="truncate" style={{ fontWeight: 700, color: "inherit" }}>{it.person.name}</Link><div className="xs muted truncate">{it.person.headline}</div></div>
        {it.match && <span className="chip chip-ok tnum">{it.match.score}%</span>}</div>
      <AvailabilityDot status={it.person.availability?.status} />
      {it.match && (<div className="xs"><span className="muted">Covers </span>{it.match.essentialCovered.length}/{it.match.essentialCovered.length + it.match.essentialMissing.length} essential skills{it.match.essentialMissing.length > 0 && <span className="muted"> · missing {it.match.essentialMissing.join(", ")}</span>}</div>)}
      <div className="xs muted">{it.overlapWithOwner} overlapping hours/week with you</div>
      <div className="row" style={{ gap: 4 }}>
        <label className="row-nowrap xs"><input type="checkbox" checked={cmp.includes(it.person.id)} onChange={(e) => setCmp(e.target.checked ? [...cmp, it.person.id].slice(-4) : cmp.filter((x) => x !== it.person.id))} />Compare</label>
        <select className="select" style={{ padding: "4px 8px", minHeight: 32, maxWidth: 150 }} aria-label={`Role for ${it.person.name}`} value={it.roleKey} onChange={(e) => move(it.person.id, it.roleKey, e.target.value)}><option value="unassigned">No role</option>{c.roles.map((r: any) => <option key={r.key} value={r.key}>{r.title}</option>)}</select>
        <button className="icon-btn" aria-label={`Remove ${it.person.name}`} onClick={() => remove(it.person.id, it.roleKey)}><Trash2 size={15} aria-hidden /></button>
      </div>
    </div>
  );
  return (
    <div className="stack-lg">
      <div className="card card-pad stack">
        <div className="row between" style={{ flexWrap: "wrap" }}>
          <input className="input" style={{ fontWeight: 800, fontSize: 20, maxWidth: 420 }} aria-label="Cart name" defaultValue={c.name} onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && patch({ name: e.target.value.trim() })} />
          <div className="row">{c.projectId && <Link className="btn btn-soft btn-sm" href={`/projects/${c.projectId}`}>Open project</Link>}<button className="btn btn-primary" onClick={() => setInvite(true)} disabled={!data.items.length}><Send aria-hidden />Invite the squad</button></div>
        </div>
        <div className="row small muted" style={{ flexWrap: "wrap" }}>
          {c.goal && <span className="chip chip-evidence">{GOAL_LABEL[c.goal as keyof typeof GOAL_LABEL]}</span>}
          <label className="row-nowrap">Budget ₹<input className="input" style={{ width: 130, minHeight: 36 }} type="number" min={0} defaultValue={c.budget ?? ""} onBlur={(e) => patch({ budget: e.target.value === "" ? null : Number(e.target.value) })} /></label>
          <span className="tnum">{data.commonHours} hours/week when everyone is free</span>
        </div>
      </div>

      <section className="stack"><h2 className="h3">Roles and people</h2>
        {c.roles.length === 0 && <p className="small muted">This cart has no roles. <Link href="/build">Draft a plan</Link> to add them, or keep a simple shortlist below.</p>}
        {c.roles.map((r: any) => {
          const people = itemsBy(r.key), fill = people.length;
          return (
            <div key={r.key} className="card card-pad stack">
              <div className="row between"><div><b>{r.title}</b> <span className="small muted">· {r.hoursPerWeek} h/week{data.budgetAllocation && ` · ₹${data.budgetAllocation.find((b: any) => b.key === r.key)?.amount.toLocaleString("en-IN")}`}</span></div><span className={`chip ${fill ? "chip-ok" : "chip-line"}`}>{fill ? `${fill} candidate${fill > 1 ? "s" : ""}` : "Open"}</span></div>
              <div className="chips">{r.essentialSkills.map((s: string) => <span key={s} className="chip">{s}</span>)}{r.optionalSkills.map((s: string) => <span key={s} className="chip chip-line">{s}</span>)}</div>
              <div className="grid grid-auto">{people.map((it: any) => <Person key={it.person.id + it.roleKey} it={it} />)}</div>
              <button className="btn btn-soft btn-sm" style={{ justifySelf: "start" }} onClick={() => setMatch(match === r.key ? null : r.key)}>{match === r.key ? "Hide suggestions" : "Suggest people"}</button>
              {match === r.key && <RoleMatches role={r} cartId={id} />}
            </div>
          );
        })}
        {unassigned.length > 0 && <div className="card card-pad stack"><b>No role yet</b><div className="grid grid-auto">{unassigned.map((it: any) => <Person key={it.person.id} it={it} />)}</div></div>}
        {!data.items.length && <p className="small">Find people in <Link href="/explore">Explore</Link> and use “Add to team”.</p>}
      </section>

      {data.coverage.essential.length > 0 && (
        <section className="card card-pad stack-sm"><h2 className="h3">Skill coverage</h2>
          <div className="chips">{data.coverage.essential.map((s: any) => <span key={s.skill} style={{ textTransform: "capitalize" }} className={`chip ${s.covered ? "chip-ok" : "chip-hot"}`}>{s.covered ? <Check aria-hidden /> : <X aria-hidden />}{s.skill}{s.covered && !s.evidenced ? " (self-claimed)" : ""}</span>)}</div>
          <p className="xs muted">Based on skills listed on profiles. “Self-claimed” means no project evidence yet. You decide whether that is enough.</p></section>
      )}

      {compared.length >= 2 && (
        <section className="stack-sm"><h2 className="h3">Compare</h2><div className="table-wrap"><table className="table"><thead><tr><th></th>{compared.map((i: any) => <th key={i.person.id}>{i.person.name}</th>)}</tr></thead><tbody>
          <tr><td>Headline</td>{compared.map((i: any) => <td key={i.person.id}>{i.person.headline || "-"}</td>)}</tr>
          <tr><td>Skills</td>{compared.map((i: any) => <td key={i.person.id}><div className="chips">{i.person.skills.slice(0, 6).map((s: any) => <SkillChip key={s.slug} name={s.name} evidenced={s.evidenceWorkIds.length > 0} />)}</div></td>)}</tr>
          <tr><td>Availability</td>{compared.map((i: any) => <td key={i.person.id}>{i.person.availability?.hoursPerWeek ?? "-"} h/week</td>)}</tr>
          <tr><td>Overlap with you</td>{compared.map((i: any) => <td key={i.person.id} className="tnum">{i.overlapWithOwner} h/week</td>)}</tr>
          <tr><td>Accepts</td>{compared.map((i: any) => <td key={i.person.id}>{i.person.compensation?.map((x: string) => COMP_LABEL[x as keyof typeof COMP_LABEL]).join(", ")}</td>)}</tr>
          <tr><td>Checked</td>{compared.map((i: any) => <td key={i.person.id}><VerifyBadges items={i.person.verifications} hideEmail /></td>)}</tr>
        </tbody></table></div></section>
      )}

      <section className="card card-pad stack-sm"><h2 className="h3">When can we all meet?</h2>
        {data.heatmap ? <><Heatmap grid={data.heatmap.grid} max={data.heatmap.max} /><p className="xs muted">Shown in your time zone. Assumes each person&apos;s current UTC offset (daylight-saving changes are ignored).</p></> :
          <div className="row"><Lock size={16} aria-hidden /><span className="small">The seven-day availability heatmap is part of <Link href="/settings/billing">Founder Pro</Link>. Your cart still shows common hours above.</span></div>}
      </section>

      <section className="card card-pad stack-sm"><h2 className="h3">Share with an advisor</h2>
        <p className="small muted">A read-only link for a mentor or friend. It shows roles and public skills, never contact details or availability. You can revoke it any time.</p>
        {c.advisorToken ? <div className="row"><CopyButton text={`${location.origin}/advisor/${c.advisorToken}`} label="Copy advisor link" /><button className="btn btn-ghost btn-sm" onClick={() => advisor(false)}>Revoke link</button></div> : <button className="btn btn-ghost btn-sm" style={{ justifySelf: "start" }} onClick={() => advisor(true)}><Link2 aria-hidden />Create advisor link</button>}
      </section>

      <div className="row"><button className="btn btn-danger btn-sm" onClick={async () => { if (confirm("Delete this cart? Invitations already sent stay valid.")) { await api.del(`/api/carts/${id}`); location.href = "/team"; } }}>Delete cart</button></div>

      <Modal open={invite} onClose={() => setInvite(false)} title="Invite the squad" wide>
        <div className="stack">
          <p className="small muted">Each person gets an invitation with the role, hours and rewards below. They decide. Messaging with them opens once they accept, in a shared squad chat.</p>
          <Field label="Project name" htmlFor="iv-t"><input id="iv-t" className="input" value={iv.title} maxLength={100} onChange={(e) => setIv({ ...iv, title: e.target.value })} /></Field>
          <Field label="What are you building, in a sentence or two?" htmlFor="iv-s"><textarea id="iv-s" className="textarea" rows={3} maxLength={600} value={iv.summary} onChange={(e) => setIv({ ...iv, summary: e.target.value })} /></Field>
          <Field label="Rewards">
            <div className="chips">{COMPENSATION.map((x) => <button type="button" key={x} className={`chip ${comp.includes(x) ? "chip-evidence" : ""}`} aria-pressed={comp.includes(x)} onClick={() => setComp(comp.includes(x) ? comp.filter((y) => y !== x) : [...comp, x])}>{COMP_LABEL[x]}</button>)}</div></Field>
          <Field label="Personal note" optional htmlFor="iv-m"><textarea id="iv-m" className="textarea" rows={2} maxLength={500} value={iv.message} onChange={(e) => setIv({ ...iv, message: e.target.value })} /></Field>
          <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn btn-ghost" onClick={() => setInvite(false)}>Cancel</button><button className="btn btn-primary" disabled={busy || iv.title.trim().length < 3 || iv.summary.trim().length < 10 || !comp.length} onClick={sendInvites}>{busy ? <span className="spinner" /> : `Send ${data.items.length} invitation${data.items.length === 1 ? "" : "s"}`}</button></div>
        </div>
      </Modal>
    </div>
  );
}
