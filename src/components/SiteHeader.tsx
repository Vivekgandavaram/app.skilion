"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-founders", label: "For founders" },
  { href: "/for-builders", label: "For builders" },
  { href: "/explore", label: "Explore" },
  { href: "/pricing", label: "Pricing" },
];

/** Dark floating island. The Skilion wordmark (white lettering) is only ever placed on this dark surface. */
export default function SiteHeader({ signedIn: initial }: { signedIn?: boolean }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  // Marketing pages are statically rendered, so signed-in state is read on the client.
  const [signedIn, setSignedIn] = useState(initial ?? false);
  useEffect(() => {
    if (initial !== undefined) return;
    fetch("/api/auth/session", { credentials: "same-origin" }).then((r) => r.json()).then((j) => setSignedIn(!!j.user)).catch(() => {});
  }, [initial]);
  return (
    <header className="site-top">
      <div className="island">
        <Link href="/" className="brand" aria-label="Skilion home"><Image src="/brand/skilion-wordmark.png" alt="Skilion" width={640} height={213} priority style={{ height: 30, width: "auto" }} /></Link>
        <nav aria-label="Main">
          {LINKS.map((l) => <a key={l.href} href={l.href} aria-current={path === l.href || path.startsWith(l.href + "/") ? "page" : undefined}>{l.label}</a>)}
        </nav>
        <div className="actions">
          {signedIn ? (
            <Link href="/discover" className="btn btn-primary btn-sm">Open Skilion</Link>
          ) : (
            <>
              <Link href="/login" className="login">Log in</Link>
              <Link href="/signup" className="btn btn-primary btn-sm">Start free</Link>
            </>
          )}
          <button className="icon-btn dark menu-btn" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      <div className="mobile-menu" hidden={!open}>
        {LINKS.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>)}
        {!signedIn && <Link href="/login" onClick={() => setOpen(false)}>Log in</Link>}
      </div>
    </header>
  );
}
