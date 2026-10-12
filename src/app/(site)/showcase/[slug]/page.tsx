import Link from "next/link";
import { notFound } from "next/navigation";
import { col, dbConfigured } from "@/lib/db";
import { GOAL_LABEL, type UserDoc } from "@/lib/types";
import { Crumbs, Ld } from "@/components/marketing/shared";
import { Avatar } from "@/components/ui";
import { env } from "@/lib/env";
import { pageMeta } from "@/lib/seo";

export const revalidate = 300;
async function load(slug: string) {
  if (!dbConfigured()) return null;
  try {
    const p = await (await col("projects")).findOne({ "showcase.enabled": true, "showcase.slug": slug });
    if (!p) return null;
    const ids = p.members.filter((m) => m.status === "active" && m.contributionConsent === true).map((m) => m.userId);
    const users = (await (await col("users")).find({ _id: { $in: ids } }).toArray()) as UserDoc[];
    const members = p.members.filter((m) => m.contributionConsent === true && m.status === "active").map((m) => {
      const u = users.find((x) => x._id.equals(m.userId));
      return u ? { name: u.name, handle: u.handle, image: u.image, role: m.roleTitle, linkable: u.visibility.public } : null;
    }).filter(Boolean) as { name: string; handle: string; image?: string; role: string; linkable: boolean }[];
    return { title: p.title, summary: p.summary, goal: p.goal, outcome: p.showcase.outcome, objectives: p.objectives, updatedAt: p.updatedAt, members };
  } catch { return null; }
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await load((await params).slug);
  return p ? pageMeta({ title: p.title, description: p.outcome || p.summary, path: `/showcase/${(await params).slug}` }) : { title: "Project" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) notFound();
  const ld = { "@context": "https://schema.org", "@type": "CreativeWork", name: p.title, description: p.outcome || p.summary, url: `${env.siteUrl}/showcase/${slug}`, dateModified: p.updatedAt, contributor: p.members.filter((m) => m.linkable).map((m) => ({ "@type": "Person", name: m.name, url: `${env.siteUrl}/u/${m.handle}` })) };
  return (
    <>
      <Ld data={ld} />
      <article className="section section-white" style={{ paddingBlock: "48px 88px" }}><div className="container container-narrow stack-lg">
        <Crumbs items={[{ name: "Showcase", path: "/showcase" }, { name: p.title, path: `/showcase/${slug}` }]} />
        <div className="stack"><span className="chip" style={{ justifySelf: "start" }}>{GOAL_LABEL[p.goal]}</span><h1 className="h1">{p.title}</h1><p className="lead">{p.summary}</p></div>
        {p.outcome && <section className="card-ice card-pad stack-sm"><h2 className="h3">Outcome</h2><p>{p.outcome}</p></section>}
        {p.objectives.length > 0 && <section className="stack-sm"><h2 className="h3">Objectives</h2><ul className="prose">{p.objectives.map((o) => <li key={o}>{o}</li>)}</ul></section>}
        <section className="stack"><h2 className="h3">Contributors who agreed to be listed</h2>
          {p.members.length === 0 ? <p className="muted">The owner has not listed contributors.</p> : <div className="grid grid-2">{p.members.map((m) => {
            const inner = <><Avatar name={m.name} image={m.image} /><div><b>{m.name}</b><div className="small muted">{m.role}</div></div></>;
            return m.linkable ? <Link key={m.handle} href={`/u/${m.handle}`} className="card card-pad-sm row-nowrap" style={{ textDecoration: "none", color: "inherit" }}>{inner}</Link> : <div key={m.handle} className="card card-pad-sm row-nowrap">{inner}</div>;
          })}</div>}
        </section>
      </div></article>
    </>
  );
}
