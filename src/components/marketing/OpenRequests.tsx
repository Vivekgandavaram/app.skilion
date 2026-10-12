"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import "./marketing.css";

const GOAL: Record<string, string> = { validate: "Validate an idea", prototype: "Build a prototype", help: "Get help with something", company: "Build a company" };
const COMP: Record<string, string> = { paid: "Paid", equity: "Equity", revshare: "Revenue share", learning: "Learning / credit", volunteer: "Volunteer" };
type Post = { id?: string; _id?: string; text: string; opp?: { goal: string; compensation?: string[]; skillsNeeded?: string[]; hoursPerWeek?: number } };

export default function OpenRequests() {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [items, setItems] = useState<Post[]>([]);
  useEffect(() => {
    let off = false;
    fetch("/api/posts?type=opportunity&limit=3&public=1")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad"))))
      .then((d) => { if (off) return; setItems(((d.items || []) as Post[]).filter((p) => p.opp).slice(0, 3)); setState("ready"); })
      .catch(() => { if (!off) setState("error"); });
    return () => { off = true; };
  }, []);

  if (state === "loading") return <div className="mk-skeleton-row" aria-busy="true" aria-label="Loading open requests">{[0, 1, 2].map((i) => <div key={i} className="card card-pad stack"><div className="skel" style={{ height: 14, width: "40%" }} /><div className="skel" style={{ height: 14, width: "95%" }} /><div className="skel" style={{ height: 14, width: "80%" }} /></div>)}</div>;
  if (state === "error" || !items.length) {
    return (
      <div className="card card-pad stack" style={{ padding: 32 }}>
        <h3 className="h3">No open requests are listed right now.</h3>
        <p className="muted">{state === "error" ? "We could not load listings. " : ""}Requests are written by members who need people for a project. Post yours, or browse the discover feed.</p>
        <div className="row"><Link className="btn btn-primary" href="/signup">Post a request</Link><Link className="btn btn-ghost" href="/discover">Browse discover</Link></div>
      </div>
    );
  }
  return (
    <div className="mk-skeleton-row">
      {items.map((p, i) => (
        <Link key={p.id || p._id || i} href="/discover" className="card card-hover card-pad mk-person">
          <div className="chips"><span className="chip chip-evidence">{GOAL[p.opp!.goal] || p.opp!.goal}</span></div>
          <p className="clamp-3">{p.text}</p>
          {!!p.opp!.compensation?.length && <p className="small"><strong>Compensation:</strong> {p.opp!.compensation.map((c) => COMP[c] || c).join(", ")}</p>}
          <div className="chips">{(p.opp!.skillsNeeded || []).slice(0, 4).map((s) => <span key={s} className="chip">{s}</span>)}</div>
        </Link>
      ))}
    </div>
  );
}
