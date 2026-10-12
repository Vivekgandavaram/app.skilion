"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Bookmark, Trash2, ExternalLink, Clock, Moon } from "lucide-react";
import { api, timeAgo } from "@/lib/client";
import { Avatar, VerifyBadges } from "@/components/ui";
import { ConfirmDialog, useToast } from "@/components/client-ui";
import ReportButton from "@/components/ReportButton";
import { GOAL_LABEL, COMP_LABEL, type PostMedia } from "@/lib/types";

function MediaPreview({ item }: { item: PostMedia }) {
  const vRef = useRef<HTMLVideoElement | null>(null);
  if (item.type === "image") {
    return <img src={item.url} alt={item.name || "Shared media"} style={{ width: "100%", maxHeight: 520, objectFit: "cover", borderRadius: 16, transform: `scale(${item.zoom ?? 1})`, objectPosition: `${item.cropX ?? 50}% ${item.cropY ?? 50}%` }} />;
  }

  return (
    <video
      ref={vRef}
      src={item.url}
      controls
      preload="metadata"
      muted
      playsInline
      style={{ width: "100%", maxHeight: 520, borderRadius: 16, background: "#0f172a" }}
      onLoadedMetadata={(e) => {
        const start = item.start ?? 0;
        e.currentTarget.currentTime = start;
      }}
      onTimeUpdate={(e) => {
        const start = item.start ?? 0;
        const end = item.end ?? Number.POSITIVE_INFINITY;
        if (e.currentTarget.currentTime > end) {
          e.currentTarget.currentTime = start;
          e.currentTarget.pause();
        }
      }}
    />
  );
}

export type FeedPost = {
  id: string; type: string; text: string; url?: string; tags: string[]; createdAt: string;
  media?: PostMedia[];
  preview?: { title?: string; description?: string; image?: string; siteName?: string; finalUrl?: string; fallback?: boolean };
  opp?: { goal: keyof typeof GOAL_LABEL; compensation: (keyof typeof COMP_LABEL)[]; skillsNeeded: string[]; hoursPerWeek?: number };
  counts: { likes: number; comments: number; saves: number }; work?: { id: string; title: string };
  author: { id: string; name: string; handle: string; image?: string; headline?: string; verifications?: { type: string }[]; dayJob?: boolean };
  mine: boolean; liked: boolean; saved: boolean;
};
const TYPE_LABEL: Record<string, string> = { update: "Update", project: "Project", demo: "Demo", article: "Article", opportunity: "Looking for people", squad: "Squad" };

export default function PostCard({ post, signedIn, onRemoved }: { post: FeedPost; signedIn: boolean; onRemoved?: (id: string) => void }) {
  const { toast } = useToast();
  const [p, setP] = useState(post);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<any[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(false);

  async function react(kind: "like" | "save") {
    if (!signedIn) { location.href = `/login?next=/discover`; return; }
    const key = kind === "like" ? "liked" : "saved", cnt = kind === "like" ? "likes" : "saves";
    const was = p[key];
    setP({ ...p, [key]: !was, counts: { ...p.counts, [cnt]: p.counts[cnt] + (was ? -1 : 1) } });
    try { await api.post(`/api/posts/${p.id}/react`, { kind }); } catch (e: any) { setP(p); toast(e.message, "err"); }
  }
  async function loadComments() {
    setOpen(!open);
    if (!open && !comments) { try { setComments((await api.get(`/api/posts/${p.id}/comments`)).items); } catch (e: any) { toast(e.message, "err"); } }
  }
  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    try { await api.post(`/api/posts/${p.id}/comments`, { text }); setText(""); setComments((await api.get(`/api/posts/${p.id}/comments`)).items); setP((x) => ({ ...x, counts: { ...x.counts, comments: x.counts.comments + 1 } })); }
    catch (e: any) { toast(e.message, "err"); } finally { setBusy(false); }
  }
  async function delComment(cid: string) {
    try { await api.del(`/api/posts/${p.id}/comments/${cid}`); setComments((c) => c?.filter((x) => x.id !== cid) || null); setP((x) => ({ ...x, counts: { ...x.counts, comments: Math.max(0, x.counts.comments - 1) } })); } catch (e: any) { toast(e.message, "err"); }
  }
  async function remove() {
    setBusy(true);
    try { await api.del(`/api/posts/${p.id}`); onRemoved?.(p.id); toast("Post deleted.", "ok"); } catch (e: any) { toast(e.message, "err"); setBusy(false); setDel(false); }
  }
  const href = p.preview?.finalUrl || p.url;
  return (
    <article className="card post" aria-label={`Post by ${p.author.name}`}>
      <div className="post-head">
        {p.author.handle ? <Link href={`/u/${p.author.handle}`} aria-label={`${p.author.name} profile`}><Avatar name={p.author.name} image={p.author.image} /></Link> : <Avatar name={p.author.name} />}
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="row" style={{ gap: 8 }}>
            {p.author.handle ? <Link href={`/u/${p.author.handle}`} className="truncate" style={{ fontWeight: 700, color: "inherit", textDecoration: "none" }}>{p.author.name}</Link> : <b>{p.author.name}</b>}
            {p.author.dayJob && <span className="chip chip-line"><Moon aria-hidden />After hours</span>}
          </div>
          <div className="xs muted truncate">{p.author.headline ? `${p.author.headline} · ` : ""}{timeAgo(p.createdAt)}</div>
        </div>
        <span className={`chip ${p.type === "opportunity" ? "chip-evidence" : "chip-line"}`}>{TYPE_LABEL[p.type] || p.type}</span>
      </div>
      {p.author.verifications && p.author.verifications.some((v) => v.type !== "email") && <VerifyBadges items={p.author.verifications} hideEmail />}
      <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: 0 }}>{p.text}</p>
      {p.opp && (
        <div className="opp-box stack-sm">
          <div className="row" style={{ gap: 8 }}><span className="chip chip-evidence">{GOAL_LABEL[p.opp.goal]}</span>{p.opp.hoursPerWeek ? <span className="chip chip-line"><Clock aria-hidden />{p.opp.hoursPerWeek} h/week</span> : null}</div>
          <div className="small"><b>Rewards:</b> {p.opp.compensation.map((c) => COMP_LABEL[c]).join(", ")}</div>
          <div className="chips">{p.opp.skillsNeeded.map((s) => <Link key={s} className="chip" href={`/explore?skill=${encodeURIComponent(s)}`}>{s}</Link>)}</div>
          <div className="row">
            {p.mine ? <span className="xs muted">This is your request.</span> : p.author.handle ? <Link className="btn btn-primary btn-sm" href={`/u/${p.author.handle}`}>View {p.author.name.split(" ")[0]} and respond</Link> : null}
          </div>
        </div>
      )}
      {href && p.preview && (
        <a className="link-card" href={href} target="_blank" rel="noopener noreferrer nofollow ugc">
          {p.preview.image ? <div className="thumb" style={{ backgroundImage: `url(${p.preview.image})` }} role="img" aria-label="" /> : <div className="thumb" aria-hidden />}
          <div className="meta"><span className="xs muted row-nowrap" style={{ gap: 4 }}><ExternalLink size={12} aria-hidden />{p.preview.siteName}</span><b className="clamp-2">{p.preview.title}</b>{p.preview.description && <span className="small muted clamp-2">{p.preview.description}</span>}</div>
        </a>
      )}
      {p.media && p.media.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: p.media.length > 1 ? "repeat(auto-fit, minmax(200px, 1fr))" : "1fr", gap: 12, marginTop: 12 }}>
          {p.media.map((item, idx) => (
            <div key={`${item.url}-${idx}`} style={{ position: "relative", overflow: "hidden", borderRadius: 18, border: "1px solid var(--line)", background: "#0f172a" }}>
              <MediaPreview item={item} />
              {item.type === "video" && (item.start !== undefined || item.end !== undefined) && (
                <span className="chip chip-line" style={{ position: "absolute", top: 10, left: 10, background: "rgba(15,23,42,0.75)", color: "white" }}>
                  Clip {item.start ?? 0}s–{item.end ?? "end"}s
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {p.work && p.author.handle && <div className="small muted">Linked project: <Link href={`/u/${p.author.handle}#work-${p.work.id}`}>{p.work.title}</Link></div>}
      {p.tags.length > 0 && <div className="chips">{p.tags.map((t) => <Link key={t} href={`/discover?tag=${encodeURIComponent(t)}`} className="chip chip-line">#{t}</Link>)}</div>}
      <div className="row" style={{ gap: 2, flexWrap: "wrap" }}>
        <button className={`act-btn ${p.liked ? "on" : ""}`} aria-pressed={p.liked} onClick={() => react("like")}><Heart aria-hidden fill={p.liked ? "currentColor" : "none"} />{p.counts.likes}<span className="sr-only"> likes</span></button>
        <button className="act-btn" aria-expanded={open} onClick={loadComments}><MessageCircle aria-hidden />{p.counts.comments}<span className="sr-only"> comments</span></button>
        <button className={`act-btn ${p.saved ? "on" : ""}`} aria-pressed={p.saved} onClick={() => react("save")}><Bookmark aria-hidden fill={p.saved ? "currentColor" : "none"} />{p.saved ? "Saved" : "Save"}</button>
        <span className="grow" />
        {signedIn && !p.mine && <ReportButton target={{ type: "post", id: p.id }} />}
        {p.mine && <button className="act-btn" onClick={() => setDel(true)}><Trash2 aria-hidden />Delete</button>}
      </div>
      {open && (
        <div className="stack-sm" style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          {!comments && <span className="spinner" />}
          {comments?.map((c) => (
            <div key={c.id} className="row-nowrap" style={{ alignItems: "flex-start" }}>
              <Avatar name={c.user.name} image={c.user.image} size="sm" />
              <div className="grow small"><b>{c.user.handle ? <Link href={`/u/${c.user.handle}`} style={{ color: "inherit" }}>{c.user.name}</Link> : c.user.name}</b> <span className="xs muted">{timeAgo(c.createdAt)}</span><div style={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>{c.text}</div></div>
              {(c.mine || p.mine) && <button className="icon-btn" aria-label="Delete comment" onClick={() => delComment(c.id)}><Trash2 size={15} aria-hidden /></button>}
            </div>
          ))}
          {comments && !comments.length && <p className="small muted">No comments yet.</p>}
          {signedIn ? (
            <form className="row-nowrap" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <label className="sr-only" htmlFor={`c-${p.id}`}>Write a comment</label>
              <input id={`c-${p.id}`} className="input" value={text} maxLength={600} onChange={(e) => setText(e.target.value)} placeholder="Add a thoughtful comment" />
              <button className="btn btn-dark btn-sm" disabled={busy || !text.trim()}>Post</button>
            </form>
          ) : <p className="small"><Link href="/login?next=/discover">Sign in</Link> to comment.</p>}
        </div>
      )}
      <ConfirmDialog open={del} onClose={() => setDel(false)} title="Delete this post?" body="This removes it from the feed for everyone." confirmLabel="Delete" danger busy={busy} onConfirm={remove} />
    </article>
  );
}
