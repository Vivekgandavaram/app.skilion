"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, SkillChip } from "@/components/ui";
import "./marketing.css";

type Person = { id?: string; _id?: string; name: string; handle: string; image?: string; headline?: string; domain?: string; dayJob?: boolean; skills?: { name: string; evidenceWorkIds?: string[] }[] };

export default function FeaturedBuilders() {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [items, setItems] = useState<Person[]>([]);

  useEffect(() => {
    let off = false;
    fetch("/api/explore?limit=4&public=1")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad"))))
      .then((d) => { if (off) return; const list = (d.items || d.people || []) as Person[]; setItems(list.filter((p) => p && p.handle).slice(0, 4)); setState("ready"); })
      .catch(() => { if (!off) setState("error"); });
    return () => { off = true; };
  }, []);

  if (state === "loading") {
    return (
      <div className="mk-skeleton-row" aria-busy="true" aria-label="Loading builders">
        {[0, 1, 2, 3].map((i) => <div key={i} className="card card-pad stack"><div className="skel" style={{ height: 44, width: 44, borderRadius: 999 }} /><div className="skel" style={{ height: 16, width: "70%" }} /><div className="skel" style={{ height: 12, width: "90%" }} /></div>)}
      </div>
    );
  }
  if (state === "error" || items.length === 0) {
    return (
      <div className="card card-pad center stack" style={{ padding: 40, textAlign: "center" }}>
        <h3 className="h3">Your next collaborator could be here.</h3>
        <p className="muted" style={{ maxWidth: 520 }}>{state === "error" ? "We could not load builders right now. " : ""}Add a project or skill to help people discover you.</p>
        <Link className="btn btn-primary" href="/signup">Show your work</Link>
      </div>
    );
  }
  return (
    <div className="mk-skeleton-row">
      {items.map((p) => (
        <Link key={p.handle} href={`/u/${p.handle}`} className="card card-hover card-pad mk-person">
          <div className="row-nowrap"><Avatar name={p.name} image={p.image} size="lg" /><div style={{ minWidth: 0 }}><h3 className="truncate">{p.name}</h3><span className="small muted">{p.domain || "Builder"}</span></div></div>
          {p.headline && <p className="small clamp-2">{p.headline}</p>}
          <div className="chips">{(p.skills || []).slice(0, 3).map((s) => <SkillChip key={s.name} name={s.name} evidenced={!!s.evidenceWorkIds?.length} />)}</div>
          {p.dayJob && <span className="chip chip-line" style={{ justifySelf: "start" }}>Builds after hours</span>}
        </Link>
      ))}
    </div>
  );
}
