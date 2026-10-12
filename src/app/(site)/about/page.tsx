import Illustration from "@/components/Illustration";
import { CtaBand, PageHero } from "@/components/marketing/shared";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "About Skilion and VIGO Tech", description: "Skilion is built by VIGO Tech to help people find collaborators by what they have made.", path: "/about" });

export default function Page() {
  return (
    <>
      <PageHero crumbs={[{ name: "About", path: "/about" }]} eyebrow="About" title="Skilion is built by VIGO Tech" lead="We started with a simple observation: good ideas stall because the right people never meet, and capable people with a day job rarely get a fair way to use their skills outside it." art="about" />
      <section className="section section-white"><div className="container container-narrow prose">
        <h2>Why Skilion exists</h2>
        <p>People with real skills often cannot show them in a résumé. Founders with real ideas often cannot find three people who can test them. Skilion puts proof of work first so that teams can form around what people have actually built.</p>
        <h2>What we believe</h2>
        <ul>
          <li>Proof over claims. Skills link to projects, and badges say what was checked.</li>
          <li>People before profiles. Discovery should feel like a community, not a database.</li>
          <li>AI assists, people decide. Recommendations are explainable and editable.</li>
          <li>Time is real. Many contributors have a day job, so hours and time zones are part of every match.</li>
          <li>Trust is a feature. Consent, privacy and clear states come before growth tricks.</li>
        </ul>
        <h2>Open source and contact</h2>
        <p>The Skilion code is on <a href="https://github.com/Vivekgandavaram/skilion" rel="noopener" target="_blank">GitHub</a>. VIGO Tech is at <a href="https://vigotech.in" rel="noopener" target="_blank">vigotech.in</a>. Write to us from the <a href="/contact">contact page</a>.</p>
      </div></section>
      <CtaBand title="Build something with people who show their work" body="Join free, add a project and start a conversation." primary={{ href: "/signup", label: "Start free" }} />
    </>
  );
}
