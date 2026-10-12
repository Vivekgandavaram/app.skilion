/** Server-safe presentational components (no hooks). */
import Link from "next/link";
import type { ReactNode } from "react";
import { Check, BadgeCheck, Mail, ShieldCheck, Users, FileCheck2 } from "lucide-react";

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "?";
}

export function Avatar({ name, image, size = "md", className = "" }: { name: string; image?: string; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const cls = size === "md" ? "" : `avatar-${size}`;
  return (
    <span className={`avatar ${cls} ${className}`} aria-hidden={true}>
      {image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={image} alt="" referrerPolicy="no-referrer" loading="lazy" /> : initials(name)}
    </span>
  );
}

export function Chip({ children, tone, icon }: { children: ReactNode; tone?: "ok" | "warn" | "hot" | "line" | "dark" | "evidence"; icon?: ReactNode }) {
  return <span className={`chip ${tone ? `chip-${tone}` : ""}`}>{icon}{children}</span>;
}

/** Skill with evidence marker: "Supported by project evidence" vs "Self-claimed" (spec PRO-05). */
export function SkillChip({ name, evidenced }: { name: string; evidenced?: boolean }) {
  return (
    <span className={`chip ${evidenced ? "chip-evidence" : ""}`} title={evidenced ? "Supported by project evidence" : "Self-claimed skill"}>
      {evidenced && <Check aria-hidden />}
      {name}
      <span className="sr-only">{evidenced ? " (supported by project evidence)" : " (self-claimed)"}</span>
    </span>
  );
}

export const VERIFY_COPY: Record<string, { label: string; meaning: string }> = {
  email: { label: "Email verified", meaning: "Owns the email address on this account (confirmed with a one-time code or by Google/GitHub)." },
  google: { label: "Google linked", meaning: "Signed in with a Google account whose email Google has verified." },
  github: { label: "GitHub linked", meaning: "Signed in with a GitHub account with a verified email. This does not verify repository ownership." },
  repo: { label: "Repository owner", meaning: "Proved ownership of a linked repository." },
  endorsement: { label: "Peer endorsed", meaning: "Another Skilion member endorsed a skill. This is an opinion, not a credential check." },
  identity: { label: "Identity checked", meaning: "A Skilion verifier reviewed an identity document." },
};
const VICON: Record<string, ReactNode> = { email: <Mail aria-hidden />, google: <ShieldCheck aria-hidden />, github: <ShieldCheck aria-hidden />, repo: <FileCheck2 aria-hidden />, endorsement: <Users aria-hidden />, identity: <BadgeCheck aria-hidden /> };

/** Badges always say exactly what was checked (spec PRO-07). Never says "Verified" alone. */
export function VerifyBadges({ items, hideEmail = false }: { items: { type: string }[]; hideEmail?: boolean }) {
  const types = [...new Set(items.map((i) => i.type))].filter((t) => !(hideEmail && t === "email"));
  if (!types.length) return null;
  return (
    <div className="vbadges">
      {types.map((t) => (
        <span key={t} className="chip chip-ok" title={VERIFY_COPY[t]?.meaning}>{VICON[t]}{VERIFY_COPY[t]?.label || t}</span>
      ))}
    </div>
  );
}

export function AvailabilityDot({ status }: { status?: string }) {
  const map: Record<string, [string, string]> = { open: ["dot", "Open to build"], busy: ["dot dot-busy", "Limited time"], unavailable: ["dot dot-off", "Not available"] };
  const [cls, label] = map[status || "unavailable"] || map.unavailable;
  return <span className="row-nowrap xs" style={{ gap: 6 }}><span className={cls} aria-hidden />{label}</span>;
}


export function PageHead({ title, sub, actions, eyebrow }: { title: string; sub?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 10 }}>{eyebrow}</div>}
        <h1 className="h1">{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

export function SectionHead({ eyebrow, title, sub, center }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; center?: boolean }) {
  return (
    <div className={`stack ${center ? "center" : ""}`} style={{ marginBottom: 40, maxWidth: center ? 760 : 720, marginInline: center ? "auto" : undefined }}>
      <h2 className="h2">{title}</h2>
      {sub && <p className="lead" style={center ? { marginInline: "auto" } : undefined}>{sub}</p>}
    </div>
  );
}

export function SetupNotice({ what = "the database" }: { what?: string }) {
  return (
    <div className="alert alert-warn" role="status">
      <span>Connect {what} to see live data here. Add <code>MONGODB_URI</code> to your environment (see README).</span>
    </div>
  );
}

export const ButtonLink = ({ href, children, variant = "primary", size, className = "" }: { href: string; children: ReactNode; variant?: string; size?: "sm" | "lg"; className?: string }) => (
  <Link href={href} className={`btn btn-${variant} ${size ? `btn-${size}` : ""} ${className}`}>{children}</Link>
);
