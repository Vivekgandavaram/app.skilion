"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const KEY = "sk_intro_seen";

/**
 * Cinematic first-visit intro: the original wordmark appears on black with an icy glow,
 * then glides into the real navbar logo. Shown once per browser session, skipped for
 * reduced motion, and always removed after a hard timeout so it can never trap the page.
 */
export default function BrandIntro() {
  const [phase, setPhase] = useState<"off" | "in" | "fly" | "out">("in");
  const logo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === "1"; } catch {}
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduce) { setPhase("off"); return; }
    try { sessionStorage.setItem(KEY, "1"); } catch {}
    document.documentElement.dataset.intro = "1";

    const timers: number[] = [];
    // 1) hold on the logo, then 2) fly it to the navbar position
    timers.push(window.setTimeout(() => {
      const el = logo.current;
      const target = document.querySelector<HTMLElement>(".site-top .brand img, .app-top .brand img, .brand img");
      if (el && target) {
        const a = el.getBoundingClientRect(), b = target.getBoundingClientRect();
        if (b.width > 0) {
          const s = b.width / a.width;
          const dx = b.left + b.width / 2 - (a.left + a.width / 2);
          const dy = b.top + b.height / 2 - (a.top + a.height / 2);
          el.style.setProperty("--fly", `translate(${dx}px, ${dy}px) scale(${s})`);
        }
      }
      setPhase("fly");
    }, 1700));
    timers.push(window.setTimeout(() => { delete document.documentElement.dataset.intro; setPhase("out"); }, 2500));
    timers.push(window.setTimeout(() => setPhase("off"), 3200));
    timers.push(window.setTimeout(() => setPhase("off"), 5000)); // hard stop
    return () => { timers.forEach(clearTimeout); delete document.documentElement.dataset.intro; };
  }, []);

  if (phase === "off") return null;
  return (
    <div className={`intro intro-${phase}`} aria-hidden="true">
      <div className="intro-glow intro-glow-a" />
      <div className="intro-glow intro-glow-b" />
      <div className="intro-stage">
        <span className="intro-ring" />
        <div className="intro-logo" ref={logo}>
          <Image src="/brand/skilion-wordmark.png" alt="" width={640} height={213} priority style={{ width: "100%", height: "auto" }} />
        </div>
      </div>
    </div>
  );
}
