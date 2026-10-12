import AppShell from "@/components/AppShell";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getSessionUser } from "@/lib/auth";

/**
 * Signed in: dark sidebar app shell. Signed out: the public site chrome, so
 * /discover, /explore and /u/[handle] stay crawlable and readable without an account.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser().catch(() => null);
  if (!user) {
    return (
      <>
        <a className="skip" href="#main">Skip to content</a>
        <SiteHeader signedIn={false} />
        <main id="main" className="container" style={{ paddingBlock: "40px 80px" }}>{children}</main>
        <SiteFooter />
      </>
    );
  }
  const me = { id: user._id.toString(), name: user.name, handle: user.handle, image: user.image, role: user.role, plan: user.plan.id, emailVerified: user.emailVerified };
  return <AppShell me={me}>{children}</AppShell>;
}
