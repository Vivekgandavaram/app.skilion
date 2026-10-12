import Link from "next/link";
import type { ReactNode } from "react";
import { env } from "@/lib/env";
import { jsonLd } from "@/lib/seo";
import Illustration from "@/components/Illustration";
import "./marketing.css";

export type Crumb = { name: string; path: string };

/** Visible breadcrumb trail plus BreadcrumbList JSON-LD. */
export function Crumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: "Home", path: "/" }, ...items];
  const ld = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${env.siteUrl}${c.path}` })),
  };
  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className="mk-crumbs">
          {all.map((c, i) => <li key={c.path}>{i === all.length - 1 ? <span aria-current="page">{c.name}</span> : <Link href={c.path}>{c.name}</Link>}</li>)}
        </ol>
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
    </>
  );
}

export function Ld({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(data)} />;
}

/** Standard inner-page header: one h1, lead, optional actions and illustration. */
export function PageHero({ crumbs, eyebrow, title, lead, actions, art, priority = true }: { crumbs: Crumb[]; eyebrow?: string; title: string; lead: string; actions?: ReactNode; art?: string; priority?: boolean }) {
  return (
    <header className="mk-pagehero">
      <div className="container">
        <Crumbs items={crumbs} />
        <div className={art ? "split" : ""}>
          <div className="stack-lg" style={{ maxWidth: art ? undefined : 760 }}>
            <div className="stack">
              {eyebrow && <span className="eyebrow">{eyebrow}</span>}
              <h1 className="h1">{title}</h1>
              <p className="lead">{lead}</p>
            </div>
            {actions && <div className="hero-actions">{actions}</div>}
          </div>
          {art && <Illustration id={art} priority={priority} />}
        </div>
      </div>
    </header>
  );
}

/** Closing call to action band (dark). */
export function CtaBand({ title, body, primary, secondary }: { title: string; body: string; primary: { href: string; label: string }; secondary?: { href: string; label: string } }) {
  return (
    <section className="section section-dark" aria-labelledby="cta-title">
      <div className="container mk-cta">
        <div className="stack" style={{ maxWidth: 640 }}>
          <h2 className="h2" id="cta-title">{title}</h2>
          <p className="lead">{body}</p>
        </div>
        <div className="hero-actions">
          <Link className="btn btn-primary btn-lg" href={primary.href}>{primary.label}</Link>
          {secondary && <Link className="btn btn-outline-light btn-lg" href={secondary.href}>{secondary.label}</Link>}
        </div>
      </div>
    </section>
  );
}

/** Legal page frame with table of contents. sections: [{id,title,body}] */
export function LegalPage({ title, lead, path, updated = "10 October 2026", sections }: { title: string; lead: string; path: string; updated?: string; sections: { id: string; title: string; body: ReactNode }[] }) {
  return (
    <>
      <header className="mk-pagehero" style={{ paddingBlock: "48px 40px" }}>
        <div className="container">
          <Crumbs items={[{ name: title, path }]} />
          <div className="stack" style={{ maxWidth: 760 }}>
            <h1 className="h1">{title}</h1>
            <p className="lead">{lead}</p>
            <p className="small muted">Last updated {updated}</p>
          </div>
        </div>
      </header>
      <section className="section section-white" style={{ paddingBlock: "48px 88px" }}>
        <div className="container mk-legal">
          <nav className="mk-toc" aria-label="On this page">
            <strong className="small">On this page</strong>
            <ol>{sections.map((s, i) => <li key={s.id}><a href={`#${s.id}`}>{i + 1}. {s.title}</a></li>)}</ol>
          </nav>
          <article className="prose">
            {sections.map((s, i) => (
              <section key={s.id} aria-labelledby={s.id}>
                <h2 id={s.id}>{i + 1}. {s.title}</h2>
                {s.body}
              </section>
            ))}
          </article>
        </div>
      </section>
    </>
  );
}
