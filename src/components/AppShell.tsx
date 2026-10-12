"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Compass, Search, Sparkles, Users, MessageSquare, FolderKanban, Handshake, Bell, Settings, LogOut, ShieldCheck, CreditCard, UserRound, Menu, ArrowLeft } from "lucide-react";
import { APP_NAV } from "@/lib/nav";
import { api, fetcher } from "@/lib/client";
import { Avatar } from "./ui";
import CommandPalette from "./CommandPalette";
import { usePoll } from "./client-ui";

const ICONS: Record<string, any> = { Compass, Search, Sparkles, Users, MessageSquare, FolderKanban, Handshake };
type Me = { id: string; name: string; handle: string; image?: string; role: string; plan: string; emailVerified: boolean };

export default function AppShell({ me, children }: { me: Me; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [nav, setNav] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => { setNav(false); setMenu(false); }, [path]);
  useEffect(() => {
    if (!nav) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setNav(false); menuBtn.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [nav]);
  const closeNav = () => { setNav(false); menuBtn.current?.focus(); };
  const { data, mutate } = useSWR<{ notifications: number; messages: number; invites: number; bonds: number }>("/api/me/counts", fetcher, { refreshInterval: 0 });
  usePoll(() => { mutate(); }, 20000);
  const isActive = (h: string) => path === h || path.startsWith(h + "/");
  const badge = (h: string) => (h === "/messages" ? data?.messages : h === "/team" ? (data?.invites || 0) + (data?.bonds || 0) : 0) || 0;
  const logout = async () => { await api.post("/api/auth/logout"); router.push("/"); router.refresh(); };

  return (
    <div className="app">
      <a className="skip" href="#main">Skip to content</a>
      <CommandPalette admin={me.role === "admin" || me.role === "moderator"} handle={me.handle} />
      <div className={`scrim ${nav ? "on" : ""}`} onClick={closeNav} aria-hidden />
      <aside id="app-drawer" className={`sidebar ${nav ? "open" : ""}`} aria-label="App navigation">
        <div className="side-head">
          <Link href="/discover" className="brand" aria-label="Skilion"><Image src="/brand/skilion-wordmark.png" alt="Skilion" width={640} height={213} priority style={{ height: 28, width: "auto" }} /></Link>
          <button ref={closeBtn} type="button" className="icon-btn dark" aria-label="Close menu" onClick={closeNav}><ArrowLeft /></button>
        </div>
        {APP_NAV.map((n) => { const I = ICONS[n.icon]; const b = badge(n.href); return (
          <Link key={n.href} href={n.href} className="side-link" aria-current={isActive(n.href) ? "page" : undefined}><I aria-hidden />{n.label}{b > 0 && <span className="badge-n" aria-label={`${b} new`}>{b}</span>}</Link>
        ); })}
        <Link href="/notifications" className="side-link" aria-current={isActive("/notifications") ? "page" : undefined}><Bell aria-hidden />Notifications{!!data?.notifications && <span className="badge-n">{data.notifications}</span>}</Link>
        <button type="button" className="side-search" onClick={() => { setNav(false); window.dispatchEvent(new Event("sk:palette")); }}><Search aria-hidden size={16} /><span>Search</span><kbd>Ctrl K</kbd></button>
        <div className="side-foot">
          {(me.role === "admin" || me.role === "moderator") && <Link href="/admin" className="side-link" aria-current={isActive("/admin") ? "page" : undefined}><ShieldCheck aria-hidden />Admin</Link>}
          <Link href="/settings" className="side-link" aria-current={isActive("/settings") ? "page" : undefined}><Settings aria-hidden />Settings</Link>
          <Link href={`/u/${me.handle}`} className="side-user"><Avatar name={me.name} image={me.image} size="sm" /><span className="grow"><b className="truncate" style={{ display: "block", fontSize: 14 }}>{me.name}</b><span style={{ fontSize: 12, color: "#8FA1B5" }}>{me.plan === "free" ? "Free plan" : me.plan.replace("_", " ")}</span></span></Link>
          <button className="side-link" onClick={logout} style={{ background: "none", border: 0, cursor: "pointer", width: "100%" }}><LogOut aria-hidden />Sign out</button>
        </div>
      </aside>

      <div className="app-main">
        <div className="app-mobile-bar">
          <div className="row-nowrap">
            <button ref={menuBtn} type="button" className="icon-btn dark" aria-label="Open menu" aria-expanded={nav} aria-controls="app-drawer" onClick={() => setNav(true)}><Menu /></button>
            <Link href="/discover" aria-label="Skilion"><Image src="/brand/skilion-wordmark.png" alt="Skilion" width={640} height={213} style={{ height: 26, width: "auto" }} /></Link>
          </div>
          <div className="row-nowrap" style={{ position: "relative" }}>
            <button type="button" className="icon-btn dark" aria-label="Search or jump to a page" onClick={() => window.dispatchEvent(new Event("sk:palette"))}><Search /></button>
            <Link href="/notifications" className="icon-btn dark" aria-label="Notifications"><Bell />{!!data?.notifications && <span className="badge-n" style={{ position: "absolute", top: -2, right: -2 }}>{data.notifications}</span>}</Link>
            <button className="icon-btn dark" aria-label="Account menu" aria-expanded={menu} onClick={() => setMenu(!menu)} style={{ padding: 0 }}><Avatar name={me.name} image={me.image} size="sm" /></button>
            {menu && (
              <div className="menu-pop" onClick={() => setMenu(false)}>
                <Link href={`/u/${me.handle}`}><UserRound size={16} /> My profile</Link>
                <Link href="/projects"><FolderKanban size={16} /> Projects</Link>
                <Link href="/network"><Handshake size={16} /> Bonds</Link>
                <Link href="/settings"><Settings size={16} /> Settings</Link>
                <Link href="/settings/billing"><CreditCard size={16} /> Plan and billing</Link>
                {(me.role === "admin" || me.role === "moderator") && <Link href="/admin"><ShieldCheck size={16} /> Admin</Link>}
                <button onClick={logout}><LogOut size={16} /> Sign out</button>
              </div>
            )}
          </div>
        </div>
        <main id="main" className="app-content">
          {!me.emailVerified && (
            <div className="alert alert-warn" style={{ marginBottom: 20 }}>
              <span>Verify your email to send bond requests and invitations. <Link href="/verify">Enter your code</Link></span>
            </div>
          )}
          {children}
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Primary">
        {APP_NAV.filter((n) => !("desktopOnly" in n && n.desktopOnly)).map((n) => { const I = ICONS[n.icon]; const b = badge(n.href); return (
          <Link key={n.href} href={n.href} aria-label={n.label} aria-current={isActive(n.href) ? "page" : undefined}><I aria-hidden /><span className="lbl">{"short" in n ? n.short : n.label}</span>{b > 0 && <span className="badge-n">{b}</span>}</Link>
        ); })}
      </nav>
    </div>
  );
}
