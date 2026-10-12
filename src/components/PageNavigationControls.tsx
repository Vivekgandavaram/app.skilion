"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

export default function PageNavigationControls() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrollState, setScrollState] = useState({ up: false, down: false });
  const showBack = pathname.split("/").filter(Boolean).length > 1;

  useEffect(() => {
    const update = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollState({ up: window.scrollY > 120, down: maxScroll - window.scrollY > 120 });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  function goBack() {
    const segments = pathname.split("/").filter(Boolean);
    const fallback = segments.length > 1
      ? segments[0] === "u" ? "/explore" : `/${segments[0]}`
      : "/";
    if (document.referrer.startsWith(window.location.origin) && window.history.length > 1) router.back();
    else router.push(fallback);
  }

  if (!showBack && !scrollState.up && !scrollState.down) return null;

  return (
    <nav className="page-nav-controls" aria-label="Page controls">
      {showBack && <button type="button" className="page-nav-button" aria-label="Go back" title="Go back" onClick={goBack}><ArrowLeft aria-hidden /></button>}
      {scrollState.up && <button type="button" className="page-nav-button" aria-label="Scroll to top" title="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ChevronUp aria-hidden /></button>}
      {scrollState.down && <button type="button" className="page-nav-button" aria-label="Scroll down" title="Scroll down" onClick={() => window.scrollBy({ top: Math.max(360, window.innerHeight * 0.75), behavior: "smooth" })}><ChevronDown aria-hidden /></button>}
    </nav>
  );
}