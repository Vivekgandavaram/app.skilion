"use client";
import { subdomainsOf } from "@/data/taxonomy";
import Illustration from "@/components/Illustration";
import { useState } from "react";
import Link from "next/link";
import useSWRInfinite from "swr/infinite";
import useSWR from "swr";
import { Search, Bookmark, X } from "lucide-react";
import { api, fetcher } from "@/lib/client";
import { Skeleton, useDebounced, useToast } from "@/components/client-ui";
import ProfileCard from "@/components/ProfileCard";
import BondButton from "@/components/BondButton";
import AddToTeamButton from "@/components/AddToTeamButton";
import { GOALS, GOAL_LABEL, COMPENSATION, COMP_LABEL, DOMAINS } from "@/lib/types";

type F = { q: string; skills: string; domain: string; sub: string; goal: string; comp: string; availability: string; minHours: string; dayJob: string; verified: string; evidence: string; sort: string; nl: string };
const EMPTY: F = { q: "", skills: "", domain: "", sub: "", goal: "", comp: "", availability: "", minHours: "", dayJob: "", verified: "", evidence: "", sort: "relevance", nl: "" };

export default function ExploreClient({ signedIn, initial }: { signedIn: boolean; initial: Partial<F> }) {
  const { toast } = useToast();
  const [f, setF] = useState<F>({ ...EMPTY, ...initial });
  const dq = useDebounced(f, 350);
  const qs = (cursor?: string | null) => { const p = new URLSearchParams(); Object.entries(dq).forEach(([k, v]) => v && p.set(k, v)); p.set("limit", "12"); if (!signedIn) p.set("public", "1"); if (cursor) p.set("cursor", cursor); return `/api/explore?${p}`; };
  const { data, size, setSize, isLoading, error } = useSWRInfinite((i, prev) => (prev && !prev.nextCursor ? null : qs(prev?.nextCursor)), fetcher, { revalidateFirstPage: false });
  const saved = useSWR(signedIn ? "/api/saved-searches" : null, fetcher);
  const items: any[] = data?.flatMap((d) => d.items) || [];
  const last = data?.[data.length - 1];
  const set = (k: keyof F, v: string) => setF((x) => ({ ...x, [k]: v }));
  const active = Object.entries(f).filter(([k, v]) => v && k !== "sort" && k !== "nl").length;

  async function save() {
    const name = prompt("Name this search"); if (!name) return;
    const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
    try { await api.post("/api/saved-searches", { name, params }); saved.mutate(); toast("Search saved.", "ok"); } catch (e: any) { toast(e.message, "err"); }
  }
  const Toggle = ({ k, v, label }: { k: keyof F; v: string; label: string }) => <button className={`chip ${f[k] === v ? "chip-evidence" : ""}`} aria-pressed={f[k] === v} onClick={() => set(k, f[k] === v ? "" : v)}>{label}</button>;

  return (
    <div className="two-col-wide">
      <aside className="card card-pad stack sticky-side" aria-label="Filters">
        <div className="row between"><b>Filters</b>{active > 0 && <button className="link-btn small" onClick={() => setF(EMPTY)}>Clear ({active})</button>}</div>
        <div className="field"><label className="label" htmlFor="x-skills">Skills (all of)</label><input id="x-skills" className="input" value={f.skills} onChange={(e) => set("skills", e.target.value)} placeholder="React, Figma" /></div>
        <div className="field"><label className="label" htmlFor="x-domain">Main area</label><select id="x-domain" className="select" value={f.domain} onChange={(e) => setF((x) => ({ ...x, domain: e.target.value, sub: "" }))}><option value="">Any</option>{DOMAINS.map((d) => <option key={d}>{d}</option>)}</select></div>
        {subdomainsOf(f.domain).length > 0 && <div className="field"><label className="label" htmlFor="x-sub">Sub-area</label><select id="x-sub" className="select" value={f.sub} onChange={(e) => set("sub", e.target.value)}><option value="">Any</option>{subdomainsOf(f.domain).map((d) => <option key={d}>{d}</option>)}</select></div>}
        <div className="field"><span className="label">Helps with</span><div className="chips">{GOALS.map((g) => <Toggle key={g} k="goal" v={g} label={GOAL_LABEL[g]} />)}</div></div>
        <div className="field"><span className="label">Accepts</span><div className="chips">{COMPENSATION.map((c) => <Toggle key={c} k="comp" v={c} label={COMP_LABEL[c]} />)}</div></div>
        <div className="field"><span className="label">Time</span><div className="chips"><Toggle k="availability" v="open" label="Open to build" /><Toggle k="dayJob" v="1" label="Builds after hours" /></div></div>
        <div className="field"><label className="label" htmlFor="x-hours">At least hours/week</label><input id="x-hours" className="input" type="number" min={0} max={60} value={f.minHours} onChange={(e) => set("minHours", e.target.value)} style={{ maxWidth: 110 }} /></div>
        <div className="field"><span className="label">Evidence</span><div className="chips"><Toggle k="evidence" v="1" label="Has project evidence" /><Toggle k="verified" v="repo" label="Repository owner" /><Toggle k="verified" v="identity" label="Identity checked" /></div></div>
        {signedIn && (<div className="stack-sm"><button className="btn btn-ghost btn-sm" onClick={save} disabled={!active}><Bookmark aria-hidden />Save this search</button>
          {saved.data?.items?.map((s: any) => <div key={s.id} className="row between small"><button className="link-btn" onClick={() => setF({ ...EMPTY, ...s.params })}>{s.name}</button><button className="icon-btn" aria-label={`Delete ${s.name}`} onClick={async () => { await api.del(`/api/saved-searches/${s.id}`); saved.mutate(); }}><X size={14} aria-hidden /></button></div>)}</div>)}
      </aside>
      <div className="stack">
        <div className="row-nowrap"><div style={{ position: "relative", flex: 1 }}><Search size={18} aria-hidden style={{ position: "absolute", left: 14, top: 14, color: "var(--slate)" }} /><label className="sr-only" htmlFor="x-q">Search people</label><input id="x-q" className="input" style={{ paddingLeft: 42 }} type="search" value={f.q} onChange={(e) => set("q", e.target.value)} placeholder={signedIn ? "Try: someone who knows ROS 2 and can build evenings" : "Name, skill or keyword"} /></div>
          {signedIn && <button className={`btn ${f.nl ? "btn-dark" : "btn-ghost"}`} aria-pressed={!!f.nl} onClick={() => set("nl", f.nl ? "" : "1")} title="Gemini turns your sentence into skill and area filters. Results always come from real profiles.">Describe it</button>}</div>
        <div className="row between small muted"><span>{isLoading ? "Searching" : `${data?.[0]?.total ?? 0} people`}{data?.[0]?.interpreted && <> · Read as skills: {data[0].interpreted.skills.join(", ") || "none"}{data[0].interpreted.domain ? `, ${data[0].interpreted.domain}` : ""}</>}</span>
          <select className="select" style={{ width: "auto", minHeight: 36 }} aria-label="Sort" value={f.sort} onChange={(e) => set("sort", e.target.value)}><option value="relevance">Best match</option><option value="recent">Newest</option></select></div>
        {!signedIn && <div className="alert alert-info"><span>You are seeing public profiles. <Link href="/signup">Create an account</Link> to see every builder, bond and add them to a team.</span></div>}
        {isLoading && <div className="grid grid-auto"><Skeleton h={200} /><Skeleton h={200} /></div>}
        {error && <div className="alert alert-warn">{error.message}</div>}
        {!isLoading && !items.length && !error && <div className="empty"><Illustration id="empty-discover" /><h3 className="h3">No one matches those filters</h3><p className="muted" style={{ maxWidth: 420 }}>Try fewer skills or clear a filter. New builders join every week.</p></div>}
        <div className="grid grid-auto">{items.map((p) => <ProfileCard key={p.id} person={p} actions={signedIn ? <><AddToTeamButton userId={p.id} name={p.name} /><BondButton userId={p.id} name={p.name} /></> : <Link className="btn btn-ghost btn-sm" href={`/u/${p.handle}`}>View profile</Link>} />)}</div>
        {last?.nextCursor && <button className="btn btn-ghost" onClick={() => setSize(size + 1)}>Load more</button>}
      </div>
    </div>
  );
}
