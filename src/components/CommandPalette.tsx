"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";

type Cmd = { id: string; label: string; hint?: string; href: string; keys?: string };
const base = (admin: boolean, handle: string): Cmd[] => [
  { id: "discover", label: "Discover", hint: "Feed and open requests", href: "/discover", keys: "g d" },
  { id: "explore", label: "Explore people", hint: "Filter by skill, hours, area", href: "/explore", keys: "g e" },
  { id: "build", label: "Build an idea", hint: "Draft a team plan", href: "/build", keys: "g b" },
  { id: "team", label: "My Team", hint: "Squad Carts and invitations", href: "/team", keys: "g t" },
  { id: "messages", label: "Messages", href: "/messages", keys: "g m" },
  { id: "projects", label: "Projects", href: "/projects", keys: "g p" },
  { id: "bonds", label: "Bonds", hint: "Requests and your bonded people", href: "/network" },
  { id: "invites", label: "Invitations", href: "/invites" },
  { id: "notifications", label: "Notifications", href: "/notifications" },
  { id: "profile", label: "My profile", href: `/u/${handle}` },
  { id: "s-profile", label: "Edit profile", hint: "Settings", href: "/settings/profile" },
  { id: "s-avail", label: "Set availability", hint: "Settings", href: "/settings/availability" },
  { id: "s-work", label: "Add proof of work", hint: "Settings", href: "/settings/proof-of-work" },
  { id: "s-priv", label: "Privacy", hint: "Settings", href: "/settings/privacy" },
  { id: "s-bill", label: "Plan and billing", hint: "Settings", href: "/settings/billing" },
  ...(admin ? [{ id: "admin", label: "Admin", href: "/admin" }] : []),
];

export default function CommandPalette({ admin, handle }: { admin: boolean; handle: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const all = useMemo(() => base(admin, handle), [admin, handle]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const hit = all.filter((c) => !t || `${c.label} ${c.hint || ""}`.toLowerCase().includes(t));
    return t ? [{ id: "search", label: `Search people for “${q.trim()}”`, hint: "Explore", href: `/explore?q=${encodeURIComponent(q.trim())}` }, ...hit] : hit;
  }, [q, all]);

  useEffect(() => {
    let pending = 0;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); opener.current = document.activeElement as HTMLElement; setOpen((o) => !o); setQ(""); setI(0); return; }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      // two-key go-to shortcuts, like "g" then "d"
      if (e.key === "g") { pending = Date.now(); return; }
      if (pending && Date.now() - pending < 900) { const c = all.find((x) => x.keys === `g ${e.key}`); pending = 0; if (c) router.push(c.href); }
    };
    const onOpen = () => { opener.current = document.activeElement as HTMLElement; setOpen(true); setQ(""); setI(0); };
    window.addEventListener("keydown", onKey); window.addEventListener("sk:palette", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("sk:palette", onOpen); };
  }, [all, router]);
  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 10); else opener.current?.focus?.(); }, [open]);
  useEffect(() => { setI(0); }, [q]);

  if (!open) return null;
  const go = (c?: Cmd) => { if (!c) return; setOpen(false); router.push(c.href); };
  return (
    <div className="cp-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="cp" role="dialog" aria-modal="true" aria-label="Command menu">
        <div className="cp-in"><Search size={16} aria-hidden /><input ref={input} role="combobox" aria-expanded="true" aria-controls="cp-list" aria-activedescendant={list[i] ? `cp-${list[i].id}` : undefined} aria-label="Go to or search" placeholder="Go to a page, or type a skill to search people" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(list.length - 1, x + 1)); } else if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); } else if (e.key === "Enter") { e.preventDefault(); go(list[i]); } else if (e.key === "Escape") setOpen(false); }} /><kbd>esc</kbd></div>
        <ul id="cp-list" role="listbox" className="cp-list">
          {list.map((c, n) => (
            <li key={c.id} id={`cp-${c.id}`} role="option" aria-selected={n === i} className={n === i ? "on" : ""} onMouseMove={() => setI(n)} onClick={() => go(c)}>
              <span>{c.label}{c.hint && <small>{c.hint}</small>}</span>{c.keys ? <kbd>{c.keys}</kbd> : n === i ? <CornerDownLeft size={14} aria-hidden /> : null}
            </li>
          ))}
          {!list.length && <li className="cp-empty">Nothing matches.</li>}
        </ul>
      </div>
    </div>
  );
}
