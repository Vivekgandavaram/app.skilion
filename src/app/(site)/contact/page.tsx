import ContactForm from "@/components/marketing/ContactForm";
import { PageHero } from "@/components/marketing/shared";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Contact and support", description: "Reach the Skilion team for support, partnerships, enterprise plans, press, security reports or to appeal a decision.", path: "/contact" });

export default async function Page({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  return (
    <>
      <PageHero crumbs={[{ name: "Contact", path: "/contact" }]} eyebrow="Contact" title="Talk to the Skilion team" lead="We read every message. Tell us what you need and how to reach you." />
      <section className="section section-white"><div className="container split" style={{ alignItems: "start" }}>
        <div className="card card-pad"><ContactForm initialTopic={topic} /></div>
        <div className="stack">
          <h2 className="h3">Direct addresses</h2>
          <dl className="stack-sm" style={{ margin: 0 }}>
            <div><dt className="xs muted">Support and general</dt><dd style={{ margin: 0 }} className="mk-selectable">contact@vigotech.in</dd></div>
            <div><dt className="xs muted">Reports and moderation (reviewed within 24 hours)</dt><dd style={{ margin: 0 }} className="mk-selectable">moderation@vigotech.in</dd></div>
            <div><dt className="xs muted">Security issues</dt><dd style={{ margin: 0 }} className="mk-selectable">security@vigotech.in</dd></div>
          </dl>
          <p className="muted small">If your account was suspended, choose &quot;Appeal a decision&quot; and write from the email on the account.</p>
        </div>
      </div></section>
    </>
  );
}
