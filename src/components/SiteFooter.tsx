import Link from "next/link";
import Image from "next/image";

const cols = [
  { h: "Product", l: [["/discover", "Discover feed"], ["/explore", "Explore builders"], ["/build", "Build an idea with AI"], ["/showcase", "Showcase"], ["/pricing", "Plans and pricing"]] },
  { h: "Company", l: [["/how-it-works", "How it works"], ["/for-founders", "For founders"], ["/for-builders", "For builders"], ["/about", "About VIGO Tech"], ["/resources", "Resources"], ["/contact", "Contact and support"]] },
  { h: "Legal and trust", l: [["/terms", "Terms of service"], ["/privacy", "Privacy policy"], ["/cookies", "Cookie policy"], ["/guidelines", "Community standards"], ["/security", "Security"]] },
];

export default function SiteFooter() {
  return (
    <footer className="footer on-dark">
      <div className="container">
        <div className="footer-grid">
          <div className="stack">
            <Link href="/" aria-label="Skilion home"><Image src="/brand/skilion-wordmark.png" alt="Skilion" width={640} height={213} style={{ height: 34, width: "auto" }} /></Link>
            <p style={{ maxWidth: 320, color: "#B9C7D6" }}>Find the people to build an idea with, and check what they have shipped first. Free to join.</p>
            <a href="https://github.com/Vivekgandavaram/skilion" rel="noopener" target="_blank" className="small">Open source on GitHub</a>
          </div>
          {cols.map((c) => (
            <div key={c.h}>
              <h3>{c.h}</h3>
              <ul>{c.l.map(([href, label]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Skilion by <a href="https://vigotech.in" rel="noopener" target="_blank">VIGO Tech</a>. All rights reserved.</span>
          <span><a href="/.well-known/security.txt">security.txt</a> · <a href="/sitemap.xml">Sitemap</a></span>
        </div>
      </div>
    </footer>
  );
}
