"use client";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/client";
import { Skeleton } from "@/components/client-ui";
import { GOAL_LABEL } from "@/lib/types";

export default function ProjectsList() {
  const { data, isLoading } = useSWR("/api/projects", fetcher);
  if (isLoading) return <Skeleton h={120} />;
  if (!data?.items.length) return <div className="empty"><h3 className="h3">No projects yet</h3><p className="muted" style={{ maxWidth: 460 }}>A project starts when you invite a Squad Cart, or when someone invites you and you accept. Until then, draft a plan or browse open requests.</p><div className="row"><Link className="btn btn-primary" href="/build">Build an idea</Link><Link className="btn btn-ghost" href="/discover">Browse requests</Link></div></div>;
  return <div className="grid grid-auto">{data.items.map((p: any) => (
    <Link key={p.id} href={`/projects/${p.id}`} className="card card-hover card-pad stack-sm" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="row between"><b>{p.title}</b><span className="chip chip-line">{p.status}</span></div>
      <p className="small muted clamp-2">{p.summary}</p>
      <div className="chips"><span className="chip chip-evidence">{GOAL_LABEL[p.goal as keyof typeof GOAL_LABEL]}</span><span className="chip chip-line">{p.members} member{p.members === 1 ? "" : "s"}</span>{p.openTasks > 0 && <span className="chip chip-line">{p.openTasks} open tasks</span>}{p.mine && <span className="chip">You own this</span>}</div>
    </Link>))}</div>;
}
