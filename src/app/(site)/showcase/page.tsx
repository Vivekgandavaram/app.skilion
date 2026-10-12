import Link from "next/link";
import { col, dbConfigured } from "@/lib/db";
import { GOAL_LABEL, type Goal } from "@/lib/types";
import { PageHero } from "@/components/marketing/shared";
import { SetupNotice } from "@/components/ui";
import { EmptyState } from "@/components/EmptyState";
import { pageMeta } from "@/lib/seo";

export const revalidate = 300;
export const metadata = pageMeta({ title: "Showcase", description: "Projects built by Skilion squads and published with every member's consent.", path: "/showcase" });

export default async function Page() {
  let items: { slug: string; title: string; summary: string; goal: Goal; outcome?: string }[] = [];
  let failed = false;
  if (dbConfigured()) {
    try {
      const rows = await (await col("projects")).find({ "showcase.enabled": true, "showcase.slug": { $exists: true } }, { projection: { title: 1, summary: 1, goal: 1, showcase: 1 } }).sort({ updatedAt: -1 }).limit(48).toArray();
      items = rows.map((r) => ({ slug: r.showcase.slug!, title: r.title, summary: r.summary, goal: r.goal, outcome: r.showcase.outcome }));
    } catch { failed = true; }
  }
  return (
    <>
      <PageHero crumbs={[{ name: "Showcase", path: "/showcase" }]} eyebrow="Showcase" title="Work finished by squads" lead="Every project here was published by its owner, and only members who agreed are listed." />
      <section className="section section-white"><div className="container">
        {!dbConfigured() && <SetupNotice />}
        {failed && <div className="alert alert-warn">The showcase could not load right now. Please try again shortly.</div>}
        {items.length === 0 && dbConfigured() && !failed
          ? <EmptyState illustration="empty-projects" title="No projects yet" body="When a squad finishes something and chooses to publish it, it appears here." action={<Link className="btn btn-primary" href="/signup">Start a squad</Link>} />
          : <div className="grid grid-auto">{items.map((p) => <Link key={p.slug} href={`/showcase/${p.slug}`} className="card card-pad card-hover" style={{ textDecoration: "none", color: "inherit", display: "grid", gap: 10, alignContent: "start" }}><span className="chip" style={{ justifySelf: "start" }}>{GOAL_LABEL[p.goal]}</span><h2 className="h3">{p.title}</h2><p className="muted clamp-3">{p.outcome || p.summary}</p></Link>)}</div>}
      </div></section>
    </>
  );
}
