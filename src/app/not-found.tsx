import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Illustration from "@/components/Illustration";

export default function NotFound() {
  return (
    <>
      <SiteHeader signedIn={false} />
      <main id="main" className="container center stack" style={{ paddingBlock: "72px 96px", alignItems: "center" }}>
        <div style={{ width: "min(420px, 90%)" }}><Illustration id="not-found" /></div>
        <h1 className="h1">We could not find that page</h1>
        <p className="lead">The link may be old, or the profile or project may be private now.</p>
        <div className="row"><Link href="/" className="btn btn-dark">Back to home</Link><Link href="/explore" className="btn btn-ghost">Explore builders</Link></div>
      </main>
      <SiteFooter />
    </>
  );
}
