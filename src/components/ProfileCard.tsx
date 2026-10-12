import Link from "next/link";
import { MapPin } from "lucide-react";
import { Avatar, AvailabilityDot, SkillChip } from "./ui";

const VERIFY_LABEL: Record<string, string> = { github: "GitHub linked", google: "Google account", repo: "Repository owner checked", endorsement: "Endorsed by peers", identity: "Identity checked" };

export type Person = {
  id: string; name: string; handle: string; image?: string; headline?: string; domain?: string; subdomain?: string; location?: string; dayJob?: boolean;
  skills: { name: string; slug: string; evidenceWorkIds: string[] }[]; availability?: { status?: string; hoursPerWeek?: number };
  rate?: { min: number; max: number; currency: string; unit: string }; verifications?: { type: string }[];
  match?: { score: number; reasons: string[] };
};

/** Compact directory/cart card. Server-safe. Pass buttons through `actions`. */
export default function ProfileCard({ person: p, actions, maxSkills = 4 }: { person: Person; actions?: React.ReactNode; maxSkills?: number }) {
  const proofLine = [...new Set((p.verifications || []).map((v) => v.type))].filter((t) => t !== "email").map((t) => VERIFY_LABEL[t] || t).join(", ");
  const sorted = [...p.skills].sort((a, b) => b.evidenceWorkIds.length - a.evidenceWorkIds.length);
  return (
    <article className="card person-card card-hover">
      <div className="row-nowrap" style={{ alignItems: "flex-start" }}>
        <Link href={`/u/${p.handle}`} aria-label={`${p.name} profile`}><Avatar name={p.name} image={p.image} size="lg" /></Link>
        <div className="grow">
          <h3 className="h3 truncate"><Link href={`/u/${p.handle}`} style={{ color: "inherit", textDecoration: "none" }}>{p.name}</Link></h3>
          {p.headline && <p className="muted small clamp-2">{p.headline}</p>}
          <div className="row xs muted" style={{ gap: 10, marginTop: 4 }}>
            {p.location && <span className="row-nowrap" style={{ gap: 4 }}><MapPin size={13} aria-hidden />{p.location}</span>}
            <AvailabilityDot status={p.availability?.status} />
            {p.availability?.hoursPerWeek ? <span>{p.availability.hoursPerWeek} h/week</span> : null}
          </div>
        </div>
        {p.match && <div className="chip chip-ok tnum" title="Match score">{p.match.score}% match</div>}
      </div>
      {(p.domain || p.dayJob || p.rate) && (
        <p className="xs muted pc-line">
          {[p.domain && `${p.domain}${p.subdomain ? `, ${p.subdomain}` : ""}`, p.dayJob && "After hours", p.rate && `${p.rate.currency === "INR" ? "₹" : p.rate.currency + " "}${p.rate.min} to ${p.rate.max} per ${p.rate.unit === "hour" ? "hour" : "session"}`].filter(Boolean).join("  ·  ")}
        </p>
      )}
      {sorted.length > 0 && <div className="chips">{sorted.slice(0, maxSkills).map((s) => <SkillChip key={s.slug} name={s.name} evidenced={s.evidenceWorkIds.length > 0} />)}{sorted.length > maxSkills && <span className="chip chip-line">+{sorted.length - maxSkills}</span>}</div>}
      {proofLine && <p className="xs pc-proof">{proofLine}</p>}
      {p.match && p.match.reasons.length > 0 && (
        <details className="small"><summary style={{ cursor: "pointer", fontWeight: 600 }}>Why suggested</summary><ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>{p.match.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul><p className="xs muted mt-8">Suggested because this builder has relevant profile evidence. You decide.</p></details>
      )}
      {actions && <div className="row" style={{ marginTop: "auto" }}>{actions}</div>}
    </article>
  );
}
