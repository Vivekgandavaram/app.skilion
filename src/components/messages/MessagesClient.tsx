"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, Search, Send, MoreVertical, MoreHorizontal, Copy, Undo2, Flag, Check, CheckCheck, RotateCw, Users } from "lucide-react";
import { api, fetcher, timeAgo } from "@/lib/client";
import { Avatar, initials } from "@/components/ui";
import { Tabs, ConfirmDialog, useToast, usePoll, useDebounced, Skeleton } from "@/components/client-ui";
import ReportButton from "@/components/ReportButton";
import Illustration from "@/components/Illustration";

type Msg = { id: string; senderId: string; text: string; deleted: boolean; links: string[]; createdAt: string; clientId?: string; status?: "sending" | "failed" };
const URL_RE = /(https?:\/\/[^\s<>"')]+)/gi;
function Linkified({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return <>{parts.map((p, i) => (i % 2 ? <a key={i} href={p} target="_blank" rel="noopener noreferrer nofollow ugc" style={{ color: "inherit", textDecoration: "underline" }}>{p}</a> : <span key={i}>{p}</span>))}</>;
}
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export default function MessagesClient({ meId }: { meId: string }) {
  const router = useRouter(); const sp = useSearchParams(); const { toast } = useToast();
  const open = sp.get("c");
  const [tab, setTab] = useState<"chats" | "requests">("chats");
  const [q, setQ] = useState(""); const dq = useDebounced(q, 350);
  const convs = useSWR<{ items: any[] }>("/api/conversations", fetcher, { refreshInterval: 0 });
  const reqs = useSWR<{ items: any[] }>(tab === "requests" ? "/api/bonds?box=received" : null, fetcher);
  const search = useSWR<{ items: any[] }>(dq.trim().length >= 2 ? `/api/messages/search?q=${encodeURIComponent(dq.trim())}` : null, fetcher);
  usePoll(() => { convs.mutate(); }, 8000);
  const list = convs.data?.items || [];
  const current = list.find((c) => c.id === open);
  const select = (id: string | null) => router.replace(id ? `/messages?c=${id}` : "/messages", { scroll: false });

  return (
    <div className={`chat-layout ${open ? "has-open" : ""}`}>
      <aside className="chat-list" aria-label="Conversations">
        <div style={{ padding: 12 }} className="stack-sm">
          <Tabs value={tab} onChange={setTab} tabs={[{ value: "chats", label: "Chats" }, { value: "requests", label: "Requests" }]} />
          <div style={{ position: "relative" }}><Search size={16} aria-hidden style={{ position: "absolute", left: 12, top: 15, color: "var(--slate)" }} /><input className="input" style={{ paddingLeft: 36 }} placeholder="Search messages" aria-label="Search messages" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
        {dq.trim().length >= 2 ? (
          <div>{!search.data && <div style={{ padding: 16 }}><Skeleton h={48} /></div>}
            {search.data && !search.data.items.length && <p className="muted small" style={{ padding: 16 }}>No messages match “{dq}”.</p>}
            {search.data?.items.map((m) => <button key={m.id} className="chat-item" onClick={() => { setQ(""); select(m.convId); }}><div className="grow" style={{ minWidth: 0 }}><div className="small truncate">{m.text}</div><div className="xs muted">{m.mine ? "You" : "Them"} · {timeAgo(m.createdAt)}</div></div></button>)}</div>
        ) : tab === "requests" ? (
          <div>{!reqs.data && <div style={{ padding: 16 }}><Skeleton h={80} /></div>}
            {reqs.data && !reqs.data.items.length && <p className="muted small" style={{ padding: 16 }}>No message requests. When someone sends a bond request, their note appears here. Accept to start chatting.</p>}
            {reqs.data?.items.map((r) => (
              <div key={r.id} style={{ padding: 14, borderBottom: "1px solid #edf3f7" }} className="stack-sm">
                <div className="row-nowrap"><Avatar name={r.person.name} image={r.person.image} size="sm" /><b className="small">{r.person.name}</b></div>
                <p className="small clamp-3">{r.note}</p>
                <div className="row"><button className="btn btn-primary btn-sm" onClick={async () => { try { const j = await api.patch(`/api/bonds/${r.id}`, { action: "accept" }); toast("Bonded.", "ok"); reqs.mutate(); convs.mutate(); if (j.conversationId) select(j.conversationId); setTab("chats"); } catch (e: any) { toast(e.message, "err"); } }}>Accept</button><button className="btn btn-ghost btn-sm" onClick={async () => { try { await api.patch(`/api/bonds/${r.id}`, { action: "decline" }); reqs.mutate(); } catch (e: any) { toast(e.message, "err"); } }}>Decline</button></div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {!convs.data && <div style={{ padding: 16 }} className="stack"><Skeleton h={56} /><Skeleton h={56} /></div>}
            {convs.data && !list.length && <div className="empty"><Illustration id="empty-messages" /><h3 className="h3">No conversations yet</h3><p className="muted small">Messaging opens when someone accepts your bond request or you join a squad.</p><Link href="/explore" className="btn btn-dark btn-sm">Explore builders</Link></div>}
            {list.map((c) => {
              const name = c.kind === "squad" ? c.title || "Squad chat" : c.person?.name || "Member";
              return (
                <button key={c.id} className={`chat-item ${open === c.id ? "on" : ""}`} onClick={() => select(c.id)} aria-current={open === c.id}>
                  {c.kind === "squad" ? <span className="avatar"><Users size={18} aria-hidden /></span> : <Avatar name={name} image={c.person?.image} />}
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="row between" style={{ flexWrap: "nowrap" }}><b className="truncate" style={{ fontWeight: c.unread ? 800 : 600 }}>{name}</b>{c.last && <span className="xs muted nowrap">{timeAgo(c.last.at)}</span>}</div>
                    <div className="small muted truncate" style={{ fontWeight: c.unread ? 600 : 400 }}>{c.last ? `${c.last.mine ? "You: " : ""}${c.last.text}` : "Say hello"}</div>
                  </div>
                  {c.unread > 0 && <span className="badge-n" aria-label={`${c.unread} unread`}>{c.unread > 98 ? "99+" : c.unread}</span>}
                </button>
              );
            })}
          </div>
        )}
      </aside>
      {open ? <Thread key={open} id={open} meId={meId} summary={current} onBack={() => select(null)} onChanged={() => convs.mutate()} /> : <section className="chat-pane" style={{ display: "grid", placeItems: "center", background: "var(--pale)" }}><div className="center stack" style={{ alignItems: "center", padding: 24 }}><div style={{ width: "min(300px, 70vw)" }}><Illustration id="empty-messages" /></div><p className="muted">Choose a conversation to start.</p></div></section>}
    </div>
  );
}

function Thread({ id, meId, summary, onBack, onChanged }: { id: string; meId: string; summary: any; onBack: () => void; onChanged: () => void }) {
  const { toast } = useToast(); const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([]); const [loaded, setLoaded] = useState(false); const [err, setErr] = useState("");
  const [typing, setTyping] = useState<string[]>([]); const [reads, setReads] = useState<Record<string, string>>({}); const [myRead, setMyRead] = useState<string | null>(null);
  const [text, setText] = useState(""); const [menu, setMenu] = useState(false); const [muted, setMuted] = useState(!!summary?.muted);
  const [fast, setFast] = useState(0);
  const [actionFor, setActionFor] = useState<string | null>(null); const [reportId, setReportId] = useState<string | null>(null); const [unsendFor, setUnsendFor] = useState<Msg | null>(null); const pressTimer = useRef<number>(0);
  useEffect(() => { if (!actionFor) return; const close = (e: Event) => { if (!(e.target as HTMLElement).closest?.("[data-msg-menu]")) setActionFor(null); }; const key = (e: KeyboardEvent) => { if (e.key === "Escape") setActionFor(null); }; document.addEventListener("pointerdown", close); document.addEventListener("keydown", key); return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", key); }; }, [actionFor]);
  const body = useRef<HTMLDivElement>(null); const atBottom = useRef(true); const lastTyping = useRef(0); const lastRead = useRef(0);
  const realLast = useMemo(() => [...msgs].reverse().find((m) => !m.status)?.id, [msgs]);

  const merge = useCallback((incoming: Msg[]) => {
    setMsgs((prev) => {
      const byId = new Map<string, Msg>(); const out: Msg[] = [];
      const pending = prev.filter((m) => m.status);
      for (const m of [...prev.filter((m) => !m.status), ...incoming]) byId.set(m.id, m);
      for (const m of [...byId.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) out.push(m);
      const sentIds = new Set(out.map((m) => m.clientId).filter(Boolean));
      return [...out, ...pending.filter((p) => !sentIds.has(p.clientId))];
    });
  }, []);

  const fetchNew = useCallback(async (initial = false) => {
    try {
      const j = await api.get(`/api/conversations/${id}/messages${!initial && realLast ? `?after=${realLast}` : ""}`);
      merge(j.items); setTyping(j.typing); setReads(j.reads); setMyRead(j.myRead); setLoaded(true); setErr("");
    } catch (e: any) { if (initial) setErr(e.message); }
  }, [id, realLast, merge]);
  useEffect(() => { fetchNew(true); /* eslint-disable-next-line */ }, [id]);
  usePoll(() => fetchNew(), fast > Date.now() ? 1500 : 2500, [fetchNew, fast], loaded);

  // keep scroll at bottom only when the person was already there
  useEffect(() => { const el = body.current; if (el && atBottom.current) el.scrollTop = el.scrollHeight; }, [msgs.length, typing.length]);
  // mark as read when the newest message is from someone else and the tab is visible
  useEffect(() => {
    const last = [...msgs].reverse().find((m) => !m.status);
    if (!last || last.senderId === meId || document.visibilityState !== "visible") return;
    if (myRead && new Date(myRead) >= new Date(last.createdAt)) return;
    if (Date.now() - lastRead.current < 2000) return; lastRead.current = Date.now();
    api.post(`/api/conversations/${id}/read`).then(() => { setMyRead(new Date().toISOString()); onChanged(); }).catch(() => {});
  }, [msgs, myRead, id, meId, onChanged]);

  async function send(clientId: string, t: string) {
    try { const j = await api.post(`/api/conversations/${id}/messages`, { text: t, clientId }); setMsgs((p) => p.map((m) => (m.clientId === clientId ? { ...j.message, status: undefined } : m))); onChanged(); }
    catch (e: any) { setMsgs((p) => p.map((m) => (m.clientId === clientId ? { ...m, status: "failed" } : m))); toast(e.message, "err"); }
  }
  function submit() {
    const t = text.trim(); if (!t) return;
    const clientId = `${meId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setMsgs((p) => [...p, { id: `~${clientId}`, senderId: meId, text: t, deleted: false, links: [], createdAt: new Date().toISOString(), clientId, status: "sending" }]);
    setText(""); atBottom.current = true; setFast(Date.now() + 15000); send(clientId, t);
  }
  const retry = (m: Msg) => { setMsgs((p) => p.map((x) => (x.clientId === m.clientId ? { ...x, status: "sending" } : x))); send(m.clientId!, m.text); };
  const onType = (v: string) => { setText(v); if (Date.now() - lastTyping.current > 3000) { lastTyping.current = Date.now(); api.post(`/api/conversations/${id}/typing`).catch(() => {}); } };
  const del = async (m: Msg) => { try { await api.del(`/api/messages/${m.id}`); setMsgs((p) => p.map((x) => (x.id === m.id ? { ...x, deleted: true, text: "" } : x))); toast("Message unsent", "ok"); onChanged(); } catch (e: any) { toast(e.message, "err"); } };
  const copy = async (m: Msg) => { try { await navigator.clipboard.writeText(m.text); toast("Copied", "ok"); } catch { toast("Copy failed. Select the text and copy manually.", "err"); } };
  const block = async () => { if (!summary?.person) return; try { await api.post("/api/blocks", { userId: summary.person.id }); toast("Blocked. They can no longer message you.", "ok"); onBack(); onChanged(); } catch (e: any) { toast(e.message, "err"); } };
  const mute = async () => { try { const j = await api.post(`/api/conversations/${id}/mute`, { muted: !muted }); setMuted(j.muted); toast(j.muted ? "Muted" : "Unmuted", "ok"); } catch (e: any) { toast(e.message, "err"); } };

  const title = summary?.kind === "squad" ? summary.title || "Squad chat" : summary?.person?.name || "Conversation";
  const lastMine = [...msgs].reverse().find((m) => m.senderId === meId && !m.status && !m.deleted);
  const seenBy = lastMine ? Object.values(reads).filter((t) => new Date(t) >= new Date(lastMine.createdAt)).length : 0;
  const firstUnread = myRead ? msgs.find((m) => m.senderId !== meId && !m.status && new Date(m.createdAt) > new Date(myRead))?.id : undefined;

  return (
    <section className="chat-pane" aria-label={`Conversation with ${title}`}>
      <div className="chat-head">
        <button className="icon-btn show-sm" onClick={onBack} aria-label="Back to conversations" style={{ display: undefined }}><ArrowLeft /></button>
        {summary?.kind === "squad" ? <span className="avatar"><Users size={18} /></span> : <Avatar name={title} image={summary?.person?.image} />}
        <div className="grow" style={{ minWidth: 0 }}><b className="truncate" style={{ display: "block" }}>{title}</b><span className="xs muted">{summary?.kind === "squad" ? `${summary.memberCount} members` : summary?.person?.headline || ""}</span></div>
        <div style={{ position: "relative" }}>
          <button className="icon-btn" aria-label="Conversation options" aria-expanded={menu} onClick={() => setMenu(!menu)}><MoreVertical /></button>
          {menu && <div className="menu-pop" onClick={() => setMenu(false)}>
            {summary?.person?.handle && <Link href={`/u/${summary.person.handle}`}>View profile</Link>}
            {summary?.projectId && <Link href={`/projects/${summary.projectId}`}>Open project</Link>}
            <button onClick={mute}>{muted ? "Unmute notifications" : "Mute notifications"}</button>
            {summary?.person && <button onClick={block}>Block this person</button>}
          </div>}
        </div>
      </div>
      <div className="chat-body" ref={body} onScroll={(e) => { const el = e.currentTarget; atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }} role="log" aria-live="polite">
        {err && <div className="alert alert-error">{err} <button className="link-btn" onClick={() => fetchNew(true)}>Retry</button></div>}
        {!loaded && !err && <><Skeleton h={40} /><Skeleton h={40} /></>}
        {loaded && !msgs.length && <p className="muted center" style={{ margin: "auto" }}>No messages yet. Say hello and share what you want to build.</p>}
        {msgs.map((m, i) => {
          const mine = m.senderId === meId; const showDay = i === 0 || dayLabel(msgs[i - 1].createdAt) !== dayLabel(m.createdAt);
          return (
            <div key={m.id} style={{ display: "contents" }}>
              {showDay && <div className="xs muted center" style={{ alignSelf: "center", margin: "8px 0" }}>{dayLabel(m.createdAt)}</div>}
              {firstUnread === m.id && <div className="xs center" style={{ alignSelf: "stretch", textAlign: "center", color: "var(--vermilion-ink)", fontWeight: 700 }}>New messages</div>}
              <div className={`bubble-row ${mine ? "me" : ""}`} onContextMenu={(e) => { if (!m.status && !m.deleted) { e.preventDefault(); setActionFor(m.id); } }}
                onTouchStart={() => { if (m.status || m.deleted) return; window.clearTimeout(pressTimer.current); pressTimer.current = window.setTimeout(() => setActionFor(m.id), 450); }}
                onTouchEnd={() => window.clearTimeout(pressTimer.current)} onTouchMove={() => window.clearTimeout(pressTimer.current)}>
                <div className={`bubble ${mine ? "me" : ""}`} style={m.status === "failed" ? { borderColor: "var(--vermilion)" } : m.status === "sending" ? { opacity: 0.7 } : undefined}>
                  {m.deleted ? <em style={{ opacity: 0.7 }}>{mine ? "You unsent a message" : "Message unsent"}</em> : <Linkified text={m.text} />}
                  <span className="time">{timeLabel(m.createdAt)}{m.status === "sending" && " · Sending"}{m.status === "failed" && <> · <button className="link-btn" style={{ color: "inherit" }} onClick={() => retry(m)}><RotateCw size={11} /> Retry</button></>}</span>
                </div>
                {!m.status && !m.deleted && (
                  <div className="msg-actions" data-msg-menu>
                    <button type="button" className="msg-more" aria-label="Message actions" aria-haspopup="menu" aria-expanded={actionFor === m.id} onClick={() => setActionFor(actionFor === m.id ? null : m.id)}><MoreHorizontal size={18} aria-hidden /></button>
                    {actionFor === m.id && (
                      <div className="menu-pop msg-menu" role="menu" onClick={() => setActionFor(null)}>
                        <button role="menuitem" onClick={() => copy(m)}><Copy size={15} aria-hidden /> Copy</button>
                        {mine && <button role="menuitem" onClick={() => setUnsendFor(m)}><Undo2 size={15} aria-hidden /> Unsend</button>}
                        {!mine && <button role="menuitem" onClick={() => setReportId(m.id)}><Flag size={15} aria-hidden /> Report</button>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {lastMine && <div className="xs muted" style={{ alignSelf: "flex-end" }}>{summary?.kind === "squad" ? (seenBy ? `Seen by ${seenBy}` : "Sent") : seenBy ? <><CheckCheck size={12} style={{ verticalAlign: -2 }} /> Read</> : <><Check size={12} style={{ verticalAlign: -2 }} /> Sent</>}</div>}
      </div>
      <div className="typing" aria-live="polite">{typing.length ? `${typing.join(", ")} ${typing.length > 1 ? "are" : "is"} typing…` : ""}</div>
      <form className="chat-compose" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <textarea className="textarea" rows={1} aria-label="Message" placeholder="Write a message. Share links for files." value={text} maxLength={4000} onChange={(e) => onType(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }} />
        <button className="btn btn-primary" disabled={!text.trim()} aria-label="Send message"><Send aria-hidden /></button>
      </form>
      <ConfirmDialog open={!!unsendFor} title="Unsend this message?" body="It will be removed for everyone in this chat." confirmLabel="Unsend" danger onClose={() => setUnsendFor(null)} onConfirm={() => { const m = unsendFor; setUnsendFor(null); if (m) del(m); }} />
      {reportId && <ReportButton controlled={{ open: true, onClose: () => setReportId(null) }} target={{ type: "message", id: reportId }} />}
    </section>
  );
}
