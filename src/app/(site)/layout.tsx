import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

// No cookies() here on purpose: marketing pages stay static (fast, cacheable, great for SEO).
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
