"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { Field, Segmented, ConfirmDialog, useToast, useDebounced } from "@/components/client-ui";
import { subdomainsOf } from "@/data/taxonomy";
import SkillPicker from "@/components/SkillPicker";
import AvailabilityGrid from "@/components/AvailabilityGrid";
import { GOALS, GOAL_LABEL, COMPENSATION, COMP_LABEL, DOMAINS } from "@/lib/types";

type U = any;
const tzs = (): string[] => { try { return (Intl as any).supportedValuesOf("timeZone"); } catch { return ["Asia/Kolkata", "UTC"]; } };
function useSave(initial: U) {
  const { toast } = useToast(); const r = useRouter(); const [busy, setBusy] = useState(false);
  const save = async (patch: Record<string, unknown>, msg = "Saved.") => { setBusy(true); try { await api.put("/api/me/profile", patch); toast(msg, "ok"); r.refresh(); return true; } catch (e: any) { toast(e.message, "err"); return false; } finally { setBusy(false); } };
  return { busy, save };
}
const Toggle = ({ label, help, checked, onChange }: { label: string; help?: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="check"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span><b>{label}</b>{help && <span className="small muted" style={{ display: "block" }}>{help}</span>}</span></label>
);
const SaveBar = ({ busy }: { busy: boolean }) => <div className="row"><button className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" /> : "Save changes"}</button></div>;

export function ProfileForm({ user }: { user: U }) {
  const { busy, save } = useSave(user);
  const { toast } = useToast(); const r = useRouter();
  const [f, setF] = useState({ name: user.name, headline: user.headline || "", bio: user.bio || "", location: user.location || "", timezone: user.timezone, domain: user.domain || "", subdomain: user.subdomain || "", dayJob: !!user.dayJob, image: user.image || "" });
  const [skills, setSkills] = useState<string[]>(user.skills.map((s: any) => s.name));
  const [goals, setGoals] = useState<string[]>(user.goals); const [comp, setComp] = useState<string[]>(user.compensation);
  const [rate, setRate] = useState(user.rate ? { min: String(user.rate.min), max: String(user.rate.max), unit: user.rate.unit } : { min: "", max: "", unit: "hour" });
  const [links, setLinks] = useState({ github: user.links?.github || "", linkedin: user.links?.linkedin || "", website: user.links?.website || "", x: user.links?.x || "" });
  const [handle, setHandle] = useState(user.handle); const dh = useDebounced(handle, 400); const [hs, setHs] = useState<string>("");
  useEffect(() => { if (dh === user.handle || dh.length < 3) { setHs(""); return; } api.get(`/api/me/handle-check?handle=${encodeURIComponent(dh)}`).then((j) => setHs(j.available ? "ok" : j.reason || "taken")).catch(() => setHs("")); }, [dh, user.handle]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (handle !== user.handle) { try { await api.post("/api/me/handle", { handle }); } catch (er: any) { toast(er.message, "err"); return; } }
    const hasRate = rate.min !== "" && rate.max !== "";
    const ok = await save({ ...f, image: f.image || undefined, skills, goals, compensation: comp, links, rate: hasRate ? { min: Number(rate.min), max: Number(rate.max), currency: "INR", unit: rate.unit } : null });
    if (ok && handle !== user.handle) r.replace("/settings/profile");
  }
  const tz = tzs();
  return (
    <form className="stack-lg" onSubmit={submit}>
      <section className="card card-pad stack"><h2 className="h3">About you</h2>
        <div className="grid grid-2"><Field label="Name" htmlFor="p-name"><input id="p-name" className="input" required minLength={2} maxLength={80} value={f.name} onChange={set("name")} /></Field>
          <Field label="Handle" htmlFor="p-handle" help={`skilion.vigotech.in/u/${handle}`} error={hs && hs !== "ok" ? (hs === "taken" ? "That handle is taken." : hs) : undefined}><input id="p-handle" className="input" value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase())} /></Field></div>
        <Field label="Headline" htmlFor="p-head" help="One line: what you do and for whom."><input id="p-head" className="input" maxLength={120} value={f.headline} onChange={set("headline")} /></Field>
        <Field label="About" htmlFor="p-bio"><textarea id="p-bio" className="textarea" rows={5} maxLength={1200} value={f.bio} onChange={set("bio")} /></Field>
        <div className="grid grid-2"><Field label="Location" optional htmlFor="p-loc"><input id="p-loc" className="input" maxLength={80} value={f.location} onChange={set("location")} /></Field>
          <Field label="Time zone" htmlFor="p-tz"><select id="p-tz" className="select" value={f.timezone} onChange={set("timezone")}>{tz.map((t) => <option key={t}>{t}</option>)}</select></Field></div>
        <Field label="Photo URL" optional htmlFor="p-img" help="Link to an https image. Your Google or GitHub photo is used by default."><input id="p-img" className="input" type="url" value={f.image} onChange={set("image")} /></Field>
        <Toggle label="I have a day job and build in my spare time" help="Shown as “Builds after hours”. Nothing wrong with that. Many of our best squads work evenings and weekends." checked={f.dayJob} onChange={(v) => setF({ ...f, dayJob: v })} />
      </section>
      <section className="card card-pad stack"><h2 className="h3">Skills and what you want</h2>
        <Field label="Main area" help="Your core field, like Design or Engineering. Shown on your profile and used by the Explore filter." htmlFor="p-dom"><select id="p-dom" className="select" value={f.domain} onChange={(e) => setF({ ...f, domain: e.target.value, subdomain: "" })}><option value="">Not set</option>{DOMAINS.map((d) => <option key={d}>{d}</option>)}</select></Field>
        <Field label="Sub-area" optional htmlFor="p-sub" help="Narrow it down. Skill suggestions below follow this."><select id="p-sub" className="select" value={f.subdomain} onChange={set("subdomain")}><option value="">Not set</option>{subdomainsOf(f.domain).map((d) => <option key={d}>{d}</option>)}</select></Field>
        <Field label="Skills"><SkillPicker value={skills} onChange={setSkills} id="p-skills" domain={f.domain} subdomain={f.subdomain} /></Field>
        <Field label="Happy to help with"><div className="chips">{GOALS.map((g) => <button type="button" key={g} className={`chip ${goals.includes(g) ? "chip-evidence" : ""}`} aria-pressed={goals.includes(g)} onClick={() => setGoals(goals.includes(g) ? goals.filter((x) => x !== g) : [...goals, g])}>{GOAL_LABEL[g]}</button>)}</div></Field>
        <Field label="I will work for"><div className="chips">{COMPENSATION.map((c) => <button type="button" key={c} className={`chip ${comp.includes(c) ? "chip-evidence" : ""}`} aria-pressed={comp.includes(c)} onClick={() => setComp(comp.includes(c) ? comp.filter((x) => x !== c) : [...comp, c])}>{COMP_LABEL[c]}</button>)}</div></Field>
        <Field label="Rate for paid work (₹)" optional help="Leave blank to hide. Shown on your profile only if you allow it in Privacy.">
          <div className="row-nowrap"><input className="input" aria-label="Minimum" type="number" min={0} style={{ maxWidth: 120 }} value={rate.min} onChange={(e) => setRate({ ...rate, min: e.target.value })} /><span>to</span><input className="input" aria-label="Maximum" type="number" min={0} style={{ maxWidth: 120 }} value={rate.max} onChange={(e) => setRate({ ...rate, max: e.target.value })} />
            <select className="select" aria-label="Per" style={{ maxWidth: 140 }} value={rate.unit} onChange={(e) => setRate({ ...rate, unit: e.target.value })}><option value="hour">per hour</option><option value="session">per session</option></select></div></Field>
      </section>
      <section className="card card-pad stack"><h2 className="h3">Links</h2>
        <div className="grid grid-2">{(["github", "linkedin", "website", "x"] as const).map((k) => <Field key={k} label={k === "x" ? "X" : k[0].toUpperCase() + k.slice(1)} optional htmlFor={`l-${k}`}><input id={`l-${k}`} className="input" type="url" placeholder="https://" value={links[k]} onChange={(e) => setLinks({ ...links, [k]: e.target.value })} /></Field>)}</div></section>
      <SaveBar busy={busy} />
    </form>
  );
}

export function AvailabilityForm({ user }: { user: U }) {
  const { busy, save } = useSave(user);
  const [status, setStatus] = useState<string>(user.availability.status); const [hours, setHours] = useState(String(user.availability.hoursPerWeek)); const [slots, setSlots] = useState<number[]>(user.availability.slots);
  return (
    <form className="stack-lg" onSubmit={(e) => { e.preventDefault(); save({ availability: { status, hoursPerWeek: Number(hours) || 0, slots } }); }}>
      <section className="card card-pad stack"><h2 className="h3">Time you can give</h2>
        <Field label="Status"><Segmented label="Status" value={status as any} onChange={setStatus} options={[{ value: "open", label: "Open to build" }, { value: "busy", label: "Limited time" }, { value: "unavailable", label: "Not available" }]} /></Field>
        <Field label="Hours per week" htmlFor="a-h" help="Be realistic. Squads plan around this."><input id="a-h" className="input" type="number" min={0} max={60} style={{ maxWidth: 120 }} value={hours} onChange={(e) => setHours(e.target.value)} /></Field>
        <Field label={`When are you usually free? (${user.timezone})`} help="Paint the hours. Squads use this to find times when everyone overlaps. Daylight-saving changes are ignored.">
          <AvailabilityGrid slots={slots} onChange={setSlots} timezone={user.timezone} /></Field></section>
      <SaveBar busy={busy} />
    </form>
  );
}

export function PrivacyForm({ user }: { user: U }) {
  const { busy, save } = useSave(user); const { toast } = useToast();
  const [v, setV] = useState(user.visibility); const [ai, setAi] = useState(!!user.aiOptOut);
  const [blocked, setBlocked] = useState<any[] | null>(null);
  useEffect(() => { api.get("/api/blocks").then((j) => setBlocked(j.items)).catch(() => setBlocked([])); }, []);
  const k = (key: string) => (x: boolean) => setV({ ...v, [key]: x });
  return (
    <div className="stack-lg">
      <form className="card card-pad stack" onSubmit={(e) => { e.preventDefault(); save({ visibility: v, aiOptOut: ai }); }}>
        <h2 className="h3">Who sees what</h2>
        <Toggle label="Public profile page" help="Anyone on the web can see your page and search engines can index it. Off means only signed-in members see you." checked={v.public} onChange={k("public")} />
        <Toggle label="Show my location" checked={v.showLocation} onChange={k("showLocation")} />
        <Toggle label="Show my rate" checked={v.showRate} onChange={k("showRate")} />
        <Toggle label="Show my weekly hours" checked={v.showAvailability} onChange={k("showAvailability")} />
        <Toggle label="Show my links" checked={v.showLinks} onChange={k("showLinks")} />
        <hr className="divider" />
        <Toggle label="Keep me out of AI-assisted suggestions" help="You can still be found by search, and people can still invite you." checked={ai} onChange={setAi} />
        <SaveBar busy={busy} />
      </form>
      <section className="card card-pad stack"><h2 className="h3">Blocked people</h2>
        {blocked === null ? <span className="spinner" /> : !blocked.length ? <p className="small muted">You have not blocked anyone.</p> : blocked.map((b) => (
          <div key={b.id} className="row between"><span>{b.name} <span className="muted small">@{b.handle}</span></span><button className="btn btn-ghost btn-sm" onClick={async () => { try { await api.del("/api/blocks", { userId: b.id }); setBlocked(blocked.filter((x) => x.id !== b.id)); toast("Unblocked.", "ok"); } catch (e: any) { toast(e.message, "err"); } }}>Unblock</button></div>))}
      </section>
    </div>
  );
}

export function NotificationsForm({ user }: { user: U }) {
  const { busy, save } = useSave(user);
  const [n, setN] = useState({ ...user.notifyPrefs, quietStart: user.notifyPrefs.quietStart ?? null, quietEnd: user.notifyPrefs.quietEnd ?? null });
  const hrs = Array.from({ length: 24 }, (_, h) => h);
  return (
    <form className="card card-pad stack" onSubmit={(e) => { e.preventDefault(); save({ notifyPrefs: n }); }}>
      <h2 className="h3">Notifications</h2>
      <Toggle label="Email me about these" help={user.emailVerified ? "In-app notifications always appear. Email is optional." : "Verify your email to receive emails."} checked={n.email} onChange={(x) => setN({ ...n, email: x })} />
      <Toggle label="Bond requests and replies" checked={n.bonds} onChange={(x) => setN({ ...n, bonds: x })} />
      <Toggle label="Messages" checked={n.messages} onChange={(x) => setN({ ...n, messages: x })} />
      <Toggle label="Squad and project updates, invitations" checked={n.squads} onChange={(x) => setN({ ...n, squads: x })} />
      <Field label="Quiet hours" help={`Emails pause during these hours in your time zone (${user.timezone}). Leave both empty for none.`}>
        <div className="row-nowrap"><select className="select" aria-label="From" style={{ maxWidth: 120 }} value={n.quietStart ?? ""} onChange={(e) => setN({ ...n, quietStart: e.target.value === "" ? null : Number(e.target.value) })}><option value="">None</option>{hrs.map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}</select><span>to</span>
          <select className="select" aria-label="To" style={{ maxWidth: 120 }} value={n.quietEnd ?? ""} onChange={(e) => setN({ ...n, quietEnd: e.target.value === "" ? null : Number(e.target.value) })}><option value="">None</option>{hrs.map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}</select></div></Field>
      <SaveBar busy={busy} />
    </form>
  );
}

export function SecurityForm({ user }: { user: U }) {
  const { toast } = useToast(); const r = useRouter();
  const [pw, setPw] = useState({ current: "", next: "" }); const [busy, setBusy] = useState(false);
  const [mfaPw, setMfaPw] = useState("");
  async function changePw(e: React.FormEvent) { e.preventDefault(); setBusy(true); try { await api.post("/api/me/password", { current: pw.current || undefined, next: pw.next }); setPw({ current: "", next: "" }); toast("Password updated.", "ok"); r.refresh(); } catch (er: any) { toast(er.message, "err"); } finally { setBusy(false); } }
  async function mfa(enable: boolean) { try { await api.post("/api/me/mfa", { enable, password: mfaPw || undefined }); toast(enable ? "Two-step sign-in is on." : "Two-step sign-in is off.", "ok"); setMfaPw(""); r.refresh(); } catch (er: any) { toast(er.message, "err"); } }
  return (
    <div className="stack-lg">
      <form className="card card-pad stack" onSubmit={changePw}><h2 className="h3">{user.hasPassword ? "Change password" : "Set a password"}</h2>
        {!user.hasPassword && <p className="small muted">You signed in with a provider. A password lets you also sign in with your email.</p>}
        {user.hasPassword && <Field label="Current password" htmlFor="s-cur"><input id="s-cur" className="input" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>}
        <Field label="New password" htmlFor="s-new" help="At least 8 characters, with a letter and a number."><input id="s-new" className="input" type="password" autoComplete="new-password" minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
        <div className="row"><button className="btn btn-primary" disabled={busy || pw.next.length < 8}>Update password</button></div></form>
      <section className="card card-pad stack"><h2 className="h3">Two-step sign-in</h2>
        <p className="small muted">When on, we email a one-time code each time you sign in with your password.</p>
        {!user.emailVerified ? <p className="small">Verify your email first.</p> : user.mfa?.enabled ? <div className="row">{user.hasPassword && <input className="input" type="password" placeholder="Password" aria-label="Password to turn off" style={{ maxWidth: 220 }} value={mfaPw} onChange={(e) => setMfaPw(e.target.value)} />}<button className="btn btn-ghost" onClick={() => mfa(false)}>Turn off</button></div> : <div><button className="btn btn-dark" onClick={() => mfa(true)}>Turn on</button></div>}</section>
      <section className="card card-pad stack"><h2 className="h3">Connected accounts</h2>
        <div className="row between"><span>Google {user.providers?.google ? <span className="chip chip-ok">Linked</span> : <span className="chip chip-line">Not linked</span>}</span>{!user.providers?.google && <a className="btn btn-ghost btn-sm" href="/api/auth/google/start?next=/settings/security">Link Google</a>}</div>
        <div className="row between"><span>GitHub {user.providers?.github ? <span className="chip chip-ok">Linked{user.providers.githubLogin ? `: ${user.providers.githubLogin}` : ""}</span> : <span className="chip chip-line">Not linked</span>}</span>{!user.providers?.github && <a className="btn btn-ghost btn-sm" href="/api/auth/github/start?next=/settings/security">Link GitHub</a>}</div>
        <p className="xs muted">Linking works when the provider account uses the same verified email as this account. Linking GitHub also lets you verify repository ownership.</p></section>
    </div>
  );
}

export function DataForm({ user }: { user: U }) {
  const { toast } = useToast(); const [open, setOpen] = useState(false); const [c, setC] = useState(""); const [busy, setBusy] = useState(false);
  async function del() { setBusy(true); try { await api.del("/api/me", { confirm: c }); location.href = "/"; } catch (e: any) { toast(e.message, "err"); setBusy(false); } }
  return (
    <div className="stack-lg">
      <section className="card card-pad stack"><h2 className="h3">Download your data</h2><p className="small muted">A JSON file with your profile, projects, posts, messages you sent, plans and payments.</p><div><a className="btn btn-ghost" href="/api/me/export" download>Download my data</a></div></section>
      <section className="card card-pad stack" style={{ borderColor: "#f0b4a6" }}><h2 className="h3">Delete account</h2><p className="small muted">Removes your profile, projects, bonds and endorsements. Your posts are removed from the feed. Payment records are kept in anonymised form as required for accounting. This cannot be undone.</p>
        <div><button className="btn btn-danger" onClick={() => setOpen(true)}>Delete my account</button></div></section>
      <ConfirmDialog open={open} onClose={() => setOpen(false)} title="Delete your account?" confirmLabel="Delete forever" danger busy={busy || c !== user.handle} onConfirm={del}
        body={<div className="stack-sm"><p>Type <b>{user.handle}</b> to confirm.</p><input className="input" aria-label="Type your handle" value={c} onChange={(e) => setC(e.target.value)} /></div>} />
    </div>
  );
}
