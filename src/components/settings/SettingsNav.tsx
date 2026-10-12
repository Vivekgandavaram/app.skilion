"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const TABS = [["profile", "Profile"], ["proof-of-work", "Proof of work"], ["availability", "Availability"], ["privacy", "Privacy"], ["notifications", "Notifications"], ["security", "Security"], ["billing", "Plan and billing"], ["data", "Your data"]] as const;
export default function SettingsNav() {
  const p = usePathname();
  return <nav className="tabs" aria-label="Settings" style={{ marginBottom: 24 }}>{TABS.map(([s, l]) => <Link key={s} href={`/settings/${s}`} className={`tab ${p?.startsWith(`/settings/${s}`) ? "on" : ""}`} aria-current={p?.startsWith(`/settings/${s}`) ? "page" : undefined}>{l}</Link>)}</nav>;
}
