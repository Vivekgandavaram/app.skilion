import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Moon, Clock, Globe, ExternalLink, BadgeCheck } from "lucide-react";
import { col } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { memberView, ser } from "@/lib/serialize";
import { isBlocked } from "@/lib/relations";
import { pageMeta, jsonLd } from "@/lib/seo";
import { env } from "@/lib/env";
import { Avatar, AvailabilityDot, SkillChip, VerifyBadges } from "@/components/ui";
import BondButton from "@/components/BondButton";
import MessageButton from "@/components/MessageButton";
import AddToTeamButton from "@/components/AddToTeamButton";
import ReportButton from "@/components/ReportButton";
import { BlockButton, EndorseButton } from "@/components/profile/ProfileActions";
import { COMP_LABEL, GOAL_LABEL, type UserDoc, type WorkDoc } from "@/lib/types";
import { GitHubIcon } from "@/components/BrandIcons";
import { SetupNotice } from "@/components/ui";
import { dbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";
const find = async (handle: string) => (await (await col("users")).findOne({ handle: handle.toLowerCase(), status: "active" })) as UserDoc | null;

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  try {
    const u = await find(handle);
    if (!u || !u.visibility.public) return pageMeta({ title: "Builder profile", path: `/u/${handle}`, noindex: true });
    return pageMeta({ title: `${u.name}${u.headline ? `: ${u.headline}` : ""}`, description: (u.bio || u.headline || `${u.name} on Skilion`).slice(0, 160), path: `/u/${u.handle}`, type: "profile" });
  } catch { return pageMeta({ title: "Builder profile", noindex: true }); }
}

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!dbConfigured()) return <SetupNotice />;
  const [u, viewer] = await Promise.all([find(handle), getSessionUser().catch(() => null)]);
  if (!u || !u.onboarded && !(viewer && viewer._id.equals(u._id))) notFound();
  const mine = !!viewer && viewer._id.equals(u._id);
  if (!mine && !viewer && !u.visibility.public) {
    return (<div className="empty"><h1 className="h2">This profile is private</h1><p className="muted" style={{ maxWidth: 440 }}>Builders choose whether their page is public. Sign in to see members who share with the community.</p><Link className="btn btn-primary" href={`/login?next=/u/${u.handle}`}>Sign in</Link></div>);
  }
  if (viewer && !mine && (await isBlocked(viewer._id, u._id))) notFound();
  const p = memberView(u) as any;
  const works = (await (await col("works")).find({ userId: u._id, ...(mine ? {} : { visibility: "public" }) }).sort({ createdAt: -1 }).limit(30).toArray()) as WorkDoc[];
  const ends = viewer ? await (await col("endorsements")).find({ toId: u._id }).sort({ createdAt: -1 }).limit(20).toArray() : [];
  const endUsers = ends.length ? await (await col("users")).find({ _id: { $in: ends.map((e) => e.fromId) } }, { projection: { name: 1, handle: 1 } }).toArray() : [];
  const evidenceTitles = Object.fromEntries(works.map((w) => [w._id.toString(), w.title]));
  const ld = u.visibility.public ? { "@context": "https://schema.org", "@type": "ProfilePage", mainEntity: { "@type": "Person", name: u.name, url: `${env.siteUrl}/u/${u.handle}`, description: u.headline || undefined, image: u.image || undefined, knowsAbout: u.skills.map((s) => s.name), sameAs: u.visibility.showLinks ? Object.values(u.links).filter(Boolean) : undefined } } : null;
  const L = p.links || {};
  return (
    <div className="stack-lg">
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />}
      <header className="card card-pad stack">
        <div className="row-nowrap" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
          <Avatar name={u.name} image={u.image} size="xl" />
          <div className="grow stack-sm" style={{ minWidth: 240 }}>
            <h1 className="h1">{u.name}</h1>
            {u.headline && <p className="lead" style={{ margin: 0 }}>{u.headline}</p>}
            <div className="row small muted" style={{ gap: 14, flexWrap: "wrap" }}>
              {p.location && <span className="row-nowrap" style={{ gap: 4 }}><MapPin size={14} aria-hidden />{p.location}</span>}
              <AvailabilityDot status={p.availability?.status} />
              {p.availability?.hoursPerWeek ? <span className="row-nowrap" style={{ gap: 4 }}><Clock size={14} aria-hidden />{p.availability.hoursPerWeek} h/week</span> : null}
              <span>Time zone {u.timezone}</span>
              {u.dayJob && <span className="chip chip-line"><Moon aria-hidden />Builds after hours</span>}
            </div>
            <VerifyBadges items={p.verifications} />
          </div>
          <div className="stack-sm" style={{ minWidth: 200 }}>
            {mine ? <><Link className="btn btn-primary" href="/settings/profile">Edit profile</Link><Link className="btn btn-ghost" href="/settings/proof-of-work">Add proof of work</Link></>
              : viewer ? <div className="row"><BondButton userId={p.id} name={u.name} /><MessageButton userId={p.id} /><AddToTeamButton userId={p.id} name={u.name} /></div>
              : <><Link className="btn btn-primary" href={`/signup`}>Join to bond</Link><Link className="btn btn-ghost" href={`/login?next=/u/${u.handle}`}>Sign in</Link></>}
            {viewer && !mine && <div className="row"><ReportButton target={{ type: "user", id: p.id }} /><BlockButton userId={p.id} name={u.name} /></div>}
          </div>
        </div>
      </header>
      <div className="two-col">
        <div className="stack-lg">
          {u.bio && <section className="card card-pad stack-sm"><h2 className="h3">About</h2><p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{u.bio}</p></section>}
          <section className="stack" aria-labelledby="work-h"><h2 className="h3" id="work-h">Proof of work</h2>
            {!works.length && <div className="card card-pad muted small">{mine ? "Add projects you have built. Skills backed by a project show as evidence." : "No public projects yet."}</div>}
            {works.map((w) => (
              <article key={w._id.toString()} id={`work-${w._id}`} className="card card-pad stack-sm">
                <div className="row between"><h3 className="h4">{w.title}</h3><span className="row">{w.repoVerified && <span className="chip chip-ok"><BadgeCheck aria-hidden />Repository owner checked</span>}{w.visibility === "private" && <span className="chip chip-line">Private</span>}<span className="chip chip-line">{w.kind}</span></span></div>
                <div className="small muted">{w.role}</div>
                {w.summary && <p style={{ margin: 0 }}>{w.summary}</p>}
                {w.outcome && <p className="small"><b>Outcome:</b> {w.outcome}</p>}
                <div className="chips">{w.tech.map((t) => <span key={t} className="chip chip-line">{t}</span>)}</div>
                <div className="row small">{w.links.demo && <a href={w.links.demo} target="_blank" rel="noopener noreferrer nofollow"><ExternalLink size={13} aria-hidden /> Demo</a>}{w.links.repo && <a href={w.links.repo} target="_blank" rel="noopener noreferrer nofollow"><GitHubIcon /> Repository</a>}</div>
              </article>))}
          </section>
          {viewer && (
            <section className="stack" aria-labelledby="end-h"><div className="row between"><h2 className="h3" id="end-h">Endorsements</h2>{!mine && <EndorseButton userId={p.id} name={u.name} skills={u.skills.map((s) => s.name)} />}</div>
              {!ends.length && <p className="small muted">No endorsements yet.</p>}
              {ends.map((e) => { const f = endUsers.find((x) => x._id.equals(e.fromId)); return <div key={e._id.toString()} className="card card-pad-sm"><div className="small"><b>{e.skill}</b> · {f ? <Link href={`/u/${f.handle}`}>{f.name}</Link> : "a member"}</div><p className="small" style={{ margin: "4px 0 0" }}>{e.text}</p></div>; })}</section>)}
        </div>
        <aside className="stack">
          <section className="card card-pad stack-sm"><h2 className="h4">Skills</h2><div className="chips">{u.skills.map((s) => <SkillChip key={s.slug} name={s.name} evidenced={s.evidenceWorkIds.length > 0} />)}{!u.skills.length && <span className="small muted">None listed</span>}</div>
            <p className="xs muted">Checked skills are tied to a project above. Others are self-claimed.</p></section>
          {(u.goals.length > 0 || u.compensation.length > 0) && <section className="card card-pad stack-sm"><h2 className="h4">Open to</h2>
            {u.goals.length > 0 && <div className="chips">{u.goals.map((g) => <span key={g} className="chip">{GOAL_LABEL[g]}</span>)}</div>}
            {u.compensation.length > 0 && <><div className="small muted">Will work for</div><div className="chips">{u.compensation.map((c) => <span key={c} className="chip chip-line">{COMP_LABEL[c]}</span>)}</div></>}
            {p.rate && <div className="small tnum">Paid work: {p.rate.currency === "INR" ? "₹" : p.rate.currency + " "}{p.rate.min}-{p.rate.max} per {p.rate.unit}</div>}</section>}
          {(L.github || L.linkedin || L.website || L.x) && <section className="card card-pad stack-sm"><h2 className="h4">Links</h2>
            <div className="stack-sm small">{L.github && <a href={L.github} rel="noopener noreferrer nofollow" target="_blank"><GitHubIcon /> GitHub</a>}{L.linkedin && <a href={L.linkedin} rel="noopener noreferrer nofollow" target="_blank">LinkedIn</a>}{L.website && <a href={L.website} rel="noopener noreferrer nofollow" target="_blank"><Globe size={14} aria-hidden /> Website</a>}{L.x && <a href={L.x} rel="noopener noreferrer nofollow" target="_blank">X</a>}</div></section>}
          <p className="xs muted">Member since {new Date(u.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
        </aside>
      </div>
    </div>
  );
}
