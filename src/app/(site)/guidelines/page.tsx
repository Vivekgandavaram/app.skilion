import { LegalPage } from "@/components/marketing/shared";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Community standards", description: "The Skilion ethos and the rules that keep collaboration respectful, honest and spam-free.", path: "/guidelines" });

export default function Page() {
  return <LegalPage path="/guidelines" title="Community standards" lead="The Skilion ethos: people who make things treat each other as collaborators." sections={[
    { id: "proof", title: "Proof of work integrity", body: <ul><li>Showcase only work you actively contributed to, and label it as personal, collaborative or client work.</li><li>Tag only skills you really have. Do not inflate skills to rank in search.</li><li>Keep availability and time zone accurate and update them when your capacity changes.</li><li>Never claim a verification, badge, credential or endorsement you do not have.</li></ul> },
    { id: "respect", title: "Respectful collaboration", body: <ul><li>Keep communication professional. Technical debate is welcome. Personal attacks, slurs and condescension are not.</li><li>No discrimination on protected characteristics.</li><li>Honour commitments to squads and meetings, and flag delays early.</li><li>Respect a no. Do not keep contacting someone who declined or blocked you.</li></ul> },
    { id: "zero", title: "Zero-tolerance violations", body: <><p>These lead to immediate suspension and may lead to permanent removal:</p><ul><li>Harassment, stalking, threats or intimidation.</li><li>Spam, unsolicited advertising, crypto promotion or mass copy-and-paste outreach.</li><li>Phishing, malware or credential-stealing links.</li><li>Fraud, or impersonating people, companies or Skilion staff.</li></ul></> },
    { id: "money", title: "Money and recruiting", body: <p>Be transparent about compensation. Do not ask members for upfront payments, do not run unpaid &quot;trials&quot; that are really free work, and do not present a job or sales pitch as a squad opportunity.</p> },
    { id: "report", title: "Reporting", body: <p>Use the Report button on any profile, post, message or project, or write to moderation@vigotech.in. Moderators aim to review every report within 24 hours and urgent safety cases faster. We keep evidence, record decisions and tell affected people where appropriate.</p> },
    { id: "appeals", title: "Appeals", body: <p>If we restricted your account or content, you can appeal from the <a href="/contact?topic=appeal">contact page</a>. A different team member reviews appeals where possible.</p> },
  ]} />;
}
