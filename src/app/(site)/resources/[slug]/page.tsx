import { notFound } from "next/navigation";
import Link from "next/link";
import { GUIDES, guideBySlug } from "@/data/resources";
import { Crumbs, CtaBand, Ld } from "@/components/marketing/shared";
import { env } from "@/lib/env";
import { pageMeta } from "@/lib/seo";

export const dynamicParams = false;
export function generateStaticParams() { return GUIDES.map((g) => ({ slug: g.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const g = guideBySlug((await params).slug);
  return g ? pageMeta({ title: g.title, description: g.description, path: `/resources/${g.slug}`, type: "article" }) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const g = guideBySlug((await params).slug);
  if (!g) notFound();
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: g.title, description: g.description, datePublished: g.published, dateModified: g.published, author: { "@type": "Organization", name: "Skilion by VIGO Tech" }, publisher: { "@type": "Organization", name: "VIGO Tech" }, mainEntityOfPage: `${env.siteUrl}/resources/${g.slug}` };
  const others = GUIDES.filter((x) => x.slug !== g.slug).slice(0, 3);
  return (
    <>
      <Ld data={ld} />
      <article className="section section-white" style={{ paddingBlock: "48px 72px" }}><div className="container container-narrow">
        <Crumbs items={[{ name: "Resources", path: "/resources" }, { name: g.title, path: `/resources/${g.slug}` }]} />
        <h1 className="h1">{g.title}</h1>
        <p className="lead mt-12">{g.description}</p>
        <p className="xs muted mt-8">{g.minutes} min read · Updated {new Date(g.published).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        <div className="prose mt-32">{g.sections.map((s) => <section key={s.h}><h2>{s.h}</h2>{s.p.map((t, i) => <p key={i}>{t}</p>)}</section>)}</div>
      </div></article>
      <section className="section section-ice"><div className="container stack-lg"><h2 className="h2">More guides</h2><div className="grid grid-3">{others.map((o) => <Link key={o.slug} href={`/resources/${o.slug}`} className="card card-pad card-hover" style={{ textDecoration: "none", color: "inherit" }}><h3 className="h3">{o.title}</h3><p className="muted small mt-8">{o.description}</p></Link>)}</div></div></section>
      <CtaBand title="Put it into practice" body="Create a profile, add a project and find your squad." primary={{ href: "/signup", label: "Start free" }} />
    </>
  );
}
