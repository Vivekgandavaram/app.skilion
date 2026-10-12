import { LegalPage } from "@/components/marketing/shared";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Cookie policy", description: "Skilion uses only essential cookies for sign-in and security. No advertising or third-party analytics cookies.", path: "/cookies" });

export default function Page() {
  return <LegalPage path="/cookies" title="Cookie policy" lead="Skilion uses only the cookies it needs to keep you signed in and safe." sections={[
    { id: "what", title: "Cookies we set", body: <div className="mk-tablewrap"><table><thead><tr><th>Name</th><th>Purpose</th><th>Lifetime</th></tr></thead><tbody><tr><td><code>sk_session</code></td><td>Keeps you signed in. Essential, httpOnly and secure.</td><td>30 days</td></tr><tr><td><code>oa_google</code>, <code>oa_github</code></td><td>Protect the Google or GitHub sign-in flow against forgery.</td><td>10 minutes</td></tr></tbody></table></div> },
    { id: "none", title: "What we do not use", body: <p>We do not use advertising cookies, cross-site tracking or third-party analytics at launch. If that changes we will ask for your consent first and update this page.</p> },
    { id: "local", title: "Local storage", body: <p>We may store small interface preferences in your browser, such as a dismissed notice. This stays on your device.</p> },
    { id: "control", title: "Your choices", body: <p>You can block cookies in your browser settings, but you will not be able to sign in without the session cookie. Signing out removes it.</p> },
  ]} />;
}
