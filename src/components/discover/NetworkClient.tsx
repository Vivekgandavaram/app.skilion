"use client";
import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { api, fetcher, timeAgo } from "@/lib/client";
import { Avatar } from "@/components/ui";
import { Tabs, useToast, Skeleton } from "@/components/client-ui";
import MessageButton from "@/components/MessageButton";

type Tab = "received" | "sent" | "connections" | "blocked";
export default function NetworkClient() {
  const [tab, setTab] = useState<Tab>("received");
  const { toast } = useToast();
  const bonds = useSWR(tab === "blocked" ? null : `/api/bonds?box=${tab}`, fetcher);
  const blocked = useSWR(tab === "blocked" ? "/api/blocks" : null, fetcher);
  const counts = useSWR("/api/me/counts", fetcher);
  const act = async (id: string, action: string, ok: string) => { try { await api.patch(`/api/bonds/${id}`, { action }); toast(ok, "ok"); bonds.mutate(); counts.mutate(); } catch (e: any) { toast(e.message, "err"); } };
  const unblock = async (userId: string) => { try { await api.del("/api/blocks", { userId }); toast("Unblocked.", "ok"); blocked.mutate(); } catch (e: any) { toast(e.message, "err"); } };
  const loading = tab === "blocked" ? !blocked.data && !blocked.error : !bonds.data && !bonds.error;
  const items: any[] = (tab === "blocked" ? blocked.data?.items : bonds.data?.items) || [];
  return (
    <div className="stack">
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ value: "received", label: "Received", badge: counts.data?.bonds }, { value: "sent", label: "Sent" }, { value: "connections", label: "Bonded" }, { value: "blocked", label: "Blocked" }]} />
      <p className="muted small">A Bond is a mutual tie between two people. It unlocks messaging. It is separate from a squad invitation, which asks someone to take a role in a project.</p>
      {loading && <div className="stack"><Skeleton /><Skeleton /></div>}
      {(bonds.error || blocked.error) && <div className="alert alert-error">Could not load this list. Please refresh.</div>}
      {!loading && !items.length && <div className="card card-pad center muted" style={{ justifyContent: "center", display: "grid" }}>{tab === "received" ? "No pending requests. When someone wants to bond, you will see their note here." : tab === "sent" ? "You have no pending requests." : tab === "connections" ? "No bonds yet. Explore builders and send a short, specific note." : "You have not blocked anyone."}</div>}
      {items.map((it) => {
        const p = tab === "blocked" ? it : it.person;
        return (
          <div key={it.id || p.id} className="card card-pad-sm row" style={{ alignItems: "flex-start" }}>
            <Link href={`/u/${p.handle}`}><Avatar name={p.name} image={p.image} /></Link>
            <div className="grow">
              <div className="row between"><Link href={`/u/${p.handle}`} style={{ fontWeight: 700, color: "inherit", textDecoration: "none" }}>{p.name}</Link>{it.createdAt && <span className="xs muted">{timeAgo(it.createdAt)}</span>}</div>
              {p.headline && <div className="small muted">{p.headline}</div>}
              {it.note && <blockquote style={{ margin: "8px 0 0", padding: "8px 12px", background: "var(--pale)", borderRadius: 12 }} className="small">{it.note}</blockquote>}
              {tab === "sent" && <div className="xs muted mt-8">{it.status === "declined" ? "Declined" : "Waiting for a reply. Expires 30 days after sending."}</div>}
            </div>
            <div className="row">
              {tab === "received" && <><button className="btn btn-primary btn-sm" onClick={() => act(it.id, "accept", "Bonded. You can message now.")}>Accept</button><button className="btn btn-ghost btn-sm" onClick={() => act(it.id, "decline", "Declined.")}>Decline</button></>}
              {tab === "sent" && it.status === "requested" && <button className="btn btn-ghost btn-sm" onClick={() => act(it.id, "cancel", "Cancelled.")}>Cancel</button>}
              {tab === "connections" && <><MessageButton userId={p.id} /><button className="btn btn-ghost btn-sm" onClick={() => act(it.id, "remove", "Bond removed.")}>Remove</button></>}
              {tab === "blocked" && <button className="btn btn-ghost btn-sm" onClick={() => unblock(p.id)}>Unblock</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
