"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useSWRInfinite from "swr/infinite";
import { fetcher, api } from "@/lib/client";
import { Tabs, Skeleton, Segmented } from "@/components/client-ui";
import PostCard, { type FeedPost } from "./PostCard";
import Composer from "./Composer";
import { GOALS, GOAL_LABEL } from "@/lib/types";

type Tab = "all" | "opportunity" | "saved" | "mine";

export default function DiscoverClient({ signedIn, emailVerified, initialTag }: { signedIn: boolean; emailVerified: boolean; initialTag?: string }) {
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<"latest" | "top">("latest");
  const [goal, setGoal] = useState("");
  const [removed, setRemoved] = useState<string[]>([]);
  const [works, setWorks] = useState<{ id: string; title: string }[]>([]);
  useEffect(() => { if (signedIn) api.get("/api/works").then((j) => setWorks(j.items.filter((w: any) => w.visibility === "public").map((w: any) => ({ id: w.id, title: w.title })))).catch(() => {}); }, [signedIn]);

  const qs = (cursor?: string | null) => {
    const p = new URLSearchParams({ limit: "12", sort });
    if (tab === "opportunity") p.set("type", "opportunity");
    if (tab === "saved") p.set("saved", "1");
    if (tab === "mine") p.set("mine", "1");
    if (goal) p.set("goal", goal);
    if (initialTag) p.set("tag", initialTag);
    if (!signedIn) p.set("public", "1");
    if (cursor) p.set("cursor", cursor);
    return `/api/posts?${p}`;
  };
  const { data, size, setSize, mutate, isLoading, error } = useSWRInfinite((i, prev) => (prev && !prev.nextCursor ? null : qs(prev?.nextCursor)), fetcher, { revalidateFirstPage: false });
  const items: FeedPost[] = (data?.flatMap((d) => d.items) || []).filter((p: FeedPost) => !removed.includes(p.id));
  const last = data?.[data.length - 1];

  return (
    <div className="stack-lg">
      {signedIn ? <Composer emailVerified={emailVerified} works={works} onPosted={() => mutate()} /> : (
        <div className="card card-ice card-pad row between">
          <div><b>You are browsing as a guest.</b><p className="small muted">Sign in to post, respond to requests and message builders.</p></div>
          <div className="row"><Link className="btn btn-primary" href="/signup">Create account</Link><Link className="btn btn-ghost" href="/login?next=/discover">Sign in</Link></div>
        </div>
      )}
      <div className="row between" style={{ flexWrap: "wrap" }}>
        <Tabs value={tab} onChange={setTab} tabs={[{ value: "all", label: "All" }, { value: "opportunity", label: "Open requests" }, ...(signedIn ? [{ value: "saved" as Tab, label: "Saved" }, { value: "mine" as Tab, label: "My posts" }] : [])]} />
        <Segmented label="Sort" value={sort} onChange={setSort} options={[{ value: "latest", label: "Latest" }, { value: "top", label: "Top this month" }]} />
      </div>
      {tab === "opportunity" && <div className="filters" role="group" aria-label="Filter by goal"><button className={`chip ${!goal ? "chip-evidence" : ""}`} onClick={() => setGoal("")}>Any goal</button>{GOALS.map((g) => <button key={g} className={`chip ${goal === g ? "chip-evidence" : ""}`} onClick={() => setGoal(g)} aria-pressed={goal === g}>{GOAL_LABEL[g]}</button>)}</div>}
      {initialTag && <p className="small">Showing #{initialTag}. <Link href="/discover">Clear</Link></p>}
      {isLoading && <><Skeleton h={160} /><Skeleton h={160} /></>}
      {error && <div className="alert alert-warn">We could not load the feed. {error.message}</div>}
      {!isLoading && !error && !items.length && <div className="empty"><h3 className="h3">{tab === "saved" ? "Nothing saved yet" : tab === "mine" ? "You have not posted yet" : "Nothing here yet"}</h3><p className="muted" style={{ maxWidth: 440 }}>{tab === "opportunity" ? "Be the first to post what you need. Say the goal, the rewards and the skills." : "Share what you are building, or a request for people. Good posts say what is needed and how people will be rewarded."}</p></div>}
      <div className="stack">{items.map((p) => <PostCard key={p.id} post={p} signedIn={signedIn} onRemoved={(id) => setRemoved((r) => [...r, id])} />)}</div>
      {last?.nextCursor && <button className="btn btn-ghost" onClick={() => setSize(size + 1)}>Load more</button>}
    </div>
  );
}
