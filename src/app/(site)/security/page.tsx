import { LegalPage } from "@/components/marketing/shared";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Security", description: "How Skilion protects data and how to report a vulnerability responsibly.", path: "/security" });

export default function Page() {
  return <LegalPage path="/security" title="Security" lead="How we protect your data, and how to tell us when something is wrong." sections={[
    { id: "how", title: "How we protect data", body: <ul><li>Encryption in transit (HTTPS) and managed encryption at rest in our database.</li><li>Passwords stored as bcrypt hashes. One-time codes are hashed, expire in 10 minutes and lock after 5 wrong tries.</li><li>Sign-in with Google and GitHub uses PKCE and state checks. Optional two-step sign-in by email code.</li><li>Permission checks on every protected request, rate limiting, spam controls and safe handling of links (blocking private network addresses).</li><li>AI input and output is treated as untrusted and validated before use.</li><li>Sensitive admin actions are written to an audit trail.</li></ul> },
    { id: "report", title: "Report a vulnerability", body: <><p>Email <b className="mk-selectable">admin@vigotech.in</b> with a clear description, steps to reproduce and impact. See also <a href="/.well-known/security.txt">security.txt</a>. Please do not include real user data. We acknowledge reports within 3 working days.</p></> },
    { id: "scope", title: "Scope and safe harbour", body: <><p>In scope: skilion.vigotech.in and its APIs. Out of scope: social engineering, physical attacks, denial of service and third-party services.</p><p>If you act in good faith, avoid privacy harm and service disruption, test only against your own accounts and give us reasonable time to fix before disclosure, we will not pursue legal action against you.</p></> },
    { id: "incident", title: "If your account may be compromised", body: <p>Reset your password, review connected accounts in Settings, Security, and contact us. We will help you secure the account and tell you what we know.</p> },
  ]} />;
}
