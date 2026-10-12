"use client";
import { useState } from "react";
import Illustration from "@/components/Illustration";
import Link from "next/link";
import useSWR from "swr";
import { Plus, Users } from "lucide-react";
import { api, fetcher, timeAgo } from "@/lib/client";
import { Tabs, Skeleton, Modal, Field, useToast } from "@/components/client-ui";
import { Avatar } from "@/components/ui";
import { GOAL_LABEL } from "@/lib/types";

export default function TeamClient({ initialTab }: { initialTab: "carts" | "invitations" }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"carts" | "invitations">(initialTab);
  const carts = useSWR("/api/carts", fetcher);
  const inv = useSWR("/api/invitations?box=received", fetcher);
  const sent = useSWR("/api/invitations?box=sent", fetcher);
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [busy, setBusy] = useState(false);
  const pending = (inv.data?.items || []).filter((i: any) => i.status === "pending");

  async function create() { setBusy(true); try { const j = await api.post("/api/carts", { name }); location.href = `/team/${j.id}`; } catch (e: any) { toast(e.message, "err"); setBusy(false); } }
  async function act(id: string, action: string) {
    try { const j = await api.patch(`/api/invitations/${id}`, { action }); toast(action === "accept" ? "You joined the project." : "Done.", "ok"); inv.mutate(); sent.mutate(); if (j.projectId) location.href = `/projects/${j.projectId}`; } catch (e: any) { toast(e.message, "err"); }
  }
  return (
    <div className="stack-lg">
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "carts", label: "Squad Carts" }, { value: "invitations", label: "Invitations", badge: pending.length }]} />
      {tab === "carts" && (
        <div className="stack">
          <div className="row between"><span className="small muted">A cart is a shortlist for a team you are assembling. {carts.data ? `Your plan allows ${carts.data.limit}.` : ""}</span>
            <div className="row"><Link href="/build" className="btn btn-soft btn-sm">Draft with AI</Link><button className="btn btn-dark btn-sm" onClick={() => setOpen(true)}><Plus aria-hidden />New cart</button></div></div>
          {carts.isLoading && <Skeleton h={90} />}
          {carts.data && !carts.data.items.length && <div className="empty"><Illustration id="empty-cart" /><h3 className="h3">No carts yet</h3><p className="muted" style={{ maxWidth: 440 }}>Draft a squad plan, or add people from Explore. Nothing is sent to anyone until you invite them.</p><div className="row"><Link href="/build" className="btn btn-primary">Build an idea</Link><Link href="/explore" className="btn btn-ghost">Explore people</Link></div></div>}
          <div className="grid grid-auto">{carts.data?.items.map((c: any) => (
            <Link key={c.id} href={`/team/${c.id}`} className="card card-hover card-pad stack-sm" style={{ textDecoration: "none", color: "inherit" }}>
              <b>{c.name}</b>
              <div className="chips">{c.goal && <span className="chip chip-evidence">{GOAL_LABEL[c.goal as keyof typeof GOAL_LABEL]}</span>}<span className="chip chip-line"><Users aria-hidden />{c.members}</span>{c.projectId && <span className="chip chip-ok">Project started</span>}</div>
              <span className="xs muted">{c.roles.length} roles · updated {timeAgo(c.updatedAt)}</span>
            </Link>))}</div>
        </div>
      )}
      {tab === "invitations" && (
        <div className="stack">
          <h2 className="h3">Received</h2>
          {inv.isLoading && <Skeleton h={90} />}
          {inv.data && !inv.data.items.length && <p className="muted small">No invitations yet. When someone invites you to a project, you will see the role, hours and rewards here, and you decide.</p>}
          {inv.data?.items.map((i: any) => (
            <div key={i.id} className="card card-pad stack-sm">
              <div className="row between"><div className="row-nowrap">{i.person && <Avatar name={i.person.name} image={i.person.image} />}<div><b>{i.project?.title || "Project"}</b><div className="small muted">from {i.person?.name || "a member"} · {timeAgo(i.createdAt)}</div></div></div><span className={`chip ${i.status === "pending" ? "chip-evidence" : "chip-line"}`}>{i.status}</span></div>
              <p className="small">{i.project?.summary}</p>
              <div className="chips"><span className="chip">Role: {i.roleTitle}</span>{i.hoursPerWeek && <span className="chip chip-line">{i.hoursPerWeek} h/week</span>}{i.project?.compensation.map((c: string) => <span key={c} className="chip chip-line">{c}</span>)}</div>
              {i.message && <blockquote className="small" style={{ margin: 0, paddingLeft: 12, borderLeft: "3px solid var(--line)" }}>{i.message}</blockquote>}
              {i.status === "pending" && <div className="row"><button className="btn btn-primary btn-sm" onClick={() => act(i.id, "accept")}>Accept</button><button className="btn btn-ghost btn-sm" onClick={() => act(i.id, "decline")}>Decline</button></div>}
            </div>))}
          {sent.data?.items.length > 0 && <><h2 className="h3" style={{ marginTop: 16 }}>Sent</h2>
            {sent.data.items.map((i: any) => <div key={i.id} className="card card-pad-sm row between"><span className="small"><b>{i.person?.name}</b> · {i.roleTitle} · {i.project?.title}</span><span className="row"><span className="chip chip-line">{i.status}</span>{i.status === "pending" && <button className="btn btn-ghost btn-sm" onClick={() => act(i.id, "cancel")}>Cancel</button>}</span></div>)}</>}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="New Squad Cart">
        <div className="stack"><Field label="Name" htmlFor="cart-name"><input id="cart-name" className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Yoga booking prototype" /></Field>
          <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={!name.trim() || busy} onClick={create}>Create</button></div></div>
      </Modal>
    </div>
  );
}
