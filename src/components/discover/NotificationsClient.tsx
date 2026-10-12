"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import { Bell } from "lucide-react";
import { api, fetcher, timeAgo } from "@/lib/client";
import { Skeleton, useToast } from "@/components/client-ui";

export default function NotificationsClient() {
  const r = useRouter(); const { toast } = useToast();
  const { data, size, setSize, mutate, isLoading } = useSWRInfinite((i, prev) => (prev && !prev.nextCursor ? null : `/api/notifications?limit=30${prev?.nextCursor ? `&cursor=${prev.nextCursor}` : ""}`), fetcher, { revalidateFirstPage: true });
  const items: any[] = data?.flatMap((d) => d.items) || [];
  const last = data?.[data.length - 1];
  const open = async (n: any) => { if (!n.read) { try { await api.patch(`/api/notifications/${n.id}`); mutate(); } catch {} } if (n.href) r.push(n.href); };
  const readAll = async () => { try { await api.post("/api/notifications/read-all"); mutate(); } catch (e: any) { toast(e.message, "err"); } };
  const groups: Record<string, any[]> = {};
  for (const n of items) { const k = new Date(n.createdAt).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" }); (groups[k] ||= []).push(n); }
  return (
    <div className="stack">
      <div className="row between"><Link href="/settings/notifications" className="small">Notification settings</Link><button className="btn btn-ghost btn-sm" onClick={readAll} disabled={!items.some((n) => !n.read)}>Mark all read</button></div>
      {isLoading && <><Skeleton h={64} /><Skeleton h={64} /></>}
      {!isLoading && !items.length && <div className="card card-pad center" style={{ display: "grid", justifyItems: "center", gap: 8 }}><Bell aria-hidden color="var(--blue)" /><b>You are all caught up</b><span className="muted small">Bond requests, invitations and project updates will show up here.</span></div>}
      {Object.entries(groups).map(([day, list]) => (
        <section key={day} className="stack-sm"><h2 className="xs muted" style={{ textTransform: "uppercase", letterSpacing: ".08em" }}>{day}</h2>
          {list.map((n) => <button key={n.id} onClick={() => open(n)} className="card card-pad-sm card-hover" style={{ textAlign: "left", cursor: "pointer", borderLeft: n.read ? undefined : "4px solid var(--vermilion)" }}><div className="row between"><b className="small">{n.title}</b><span className="xs muted">{timeAgo(n.createdAt)}</span></div>{n.body && <div className="small muted clamp-2">{n.body}</div>}</button>)}
        </section>
      ))}
      {last?.nextCursor && <button className="btn btn-ghost" onClick={() => setSize(size + 1)}>Load older</button>}
    </div>
  );
}
