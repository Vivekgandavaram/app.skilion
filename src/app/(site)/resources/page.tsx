import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GUIDES } from "@/data/resources";
import { PageHero } from "@/components/marketing/shared";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Resources", description: "Practical guides for validating ideas, selling skills, building beside a day job and forming fair small teams.", path: "/resources" });

export default function Page() {
  return (
    <>
      <PageHero crumbs={[{ name: "Resources", path: "/resources" }]} eyebrow="Resources" title="Practical guides for people who build with others" lead="Short guides on finding, vetting and working with collaborators." />
      <section className="section section-white"><div className="container grid grid-3">
        {GUIDES.map((g) => (
          <article key={g.slug} className="card card-pad card-hover"><Link href={`/resources/${g.slug}`} className="mk-linkcard"><span className="xs muted">{g.minutes} min read</span><h2 className="h3">{g.title}</h2><p className="muted">{g.description}</p><span className="mk-more">Read the guide <ArrowRight aria-hidden /></span></Link></article>
        ))}
      </div></section>
    </>
  );
}
