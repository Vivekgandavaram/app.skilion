"use client";
import { useEffect, useState } from "react";
import { ImageIcon, Link2, Send, Video } from "lucide-react";
import { api } from "@/lib/client";
import { Field, Segmented, useToast, useDebounced } from "@/components/client-ui";
import SkillPicker from "@/components/SkillPicker";
import { GOALS, GOAL_LABEL, COMPENSATION, COMP_LABEL } from "@/lib/types";

type MediaDraft = {
  id: string;
  type: "image" | "video";
  url: string;
  name: string;
  mimeType: string;
  width?: number;
  height?: number;
  cropX: number;
  cropY: number;
  zoom: number;
  start?: number;
  end?: number;
  duration?: number;
};

const TYPES = [
  { value: "opportunity", label: "Looking for people" },
  { value: "update", label: "Update" },
  { value: "project", label: "Project" },
  { value: "demo", label: "Demo" },
  { value: "article", label: "Article" },
] as const;
type T = (typeof TYPES)[number]["value"];

export default function Composer({ emailVerified, onPosted, works }: { emailVerified: boolean; onPosted: () => void; works: { id: string; title: string }[] }) {
  const { toast } = useToast();
  const [type, setType] = useState<T>("opportunity");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [workId, setWorkId] = useState("");
  const [goal, setGoal] = useState<(typeof GOALS)[number]>("validate");
  const [comp, setComp] = useState<string[]>(["equity"]);
  const [skills, setSkills] = useState<string[]>([]);
  const [hours, setHours] = useState("");
  const [media, setMedia] = useState<MediaDraft[]>([]);
  const [mediaError, setMediaError] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [prev, setPrev] = useState<any>(null);
  const du = useDebounced(url, 600);
  useEffect(() => {
    let off = false;
    if (!/^https:\/\/.+\..+/.test(du)) { setPrev(null); return; }
    api.post("/api/preview", { url: du }).then((j) => !off && setPrev(j.preview)).catch(() => !off && setPrev(null));
    return () => { off = true; };
  }, [du]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (media.length > 3) {
      toast("Choose up to 3 clips or images.", "err");
      return;
    }
    setBusy(true);
    try {
      await api.post("/api/posts", {
        type, text, url: url || undefined, workId: workId || undefined,
        media: media.map((m) => ({ type: m.type, url: m.url, name: m.name, mimeType: m.mimeType, width: m.width, height: m.height, cropX: m.cropX, cropY: m.cropY, zoom: m.zoom, start: m.start, end: m.end, duration: m.duration })),
        tags: tags.split(/[ ,]+/).filter(Boolean).slice(0, 5),
        ...(type === "opportunity" ? { opp: { goal, compensation: comp, skillsNeeded: skills, hoursPerWeek: hours ? Number(hours) : undefined } } : {}),
      });
      setText(""); setUrl(""); setTags(""); setSkills([]); setPrev(null); setWorkId(""); setMedia([]); setMediaError("");
      toast("Posted.", "ok"); setOpen(false); onPosted();
    } catch (e: any) { toast(e.message, "err"); } finally { setBusy(false); }
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || !fileList.length) return;
    const files = Array.from(fileList).slice(0, 3 - media.length);
    if (!files.length) return;
    const items: MediaDraft[] = [];
    for (const file of files) {
      const okType = file.type.startsWith("image/") || file.type.startsWith("video/");
      if (!okType) { setMediaError("Use only images or short videos."); continue; }
      if (file.size > 25 * 1024 * 1024) { setMediaError("Keep each file under 25 MB."); continue; }
      const reader = new FileReader();
      const result = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read this file."));
        reader.readAsDataURL(file);
      });
      const entry: MediaDraft = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type: file.type.startsWith("video/") ? "video" : "image",
        url: result,
        name: file.name,
        mimeType: file.type,
        cropX: 50,
        cropY: 50,
        zoom: 1,
      };
      if (file.type.startsWith("video/")) {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.src = result;
        await new Promise<void>((resolve) => {
          v.onloadedmetadata = () => {
            entry.duration = v.duration;
            entry.start = 0;
            entry.end = Math.min(15, Math.max(1, v.duration));
            resolve();
          };
          v.onerror = () => resolve();
        });
      }
      items.push(entry);
    }
    if (items.length) setMedia((prev) => [...prev, ...items]);
    if (!items.length && !mediaError) setMediaError("No valid media selected.");
  }

  function updateMedia(id: string, patch: Partial<MediaDraft>) {
    setMedia((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  if (!emailVerified) return <div className="alert alert-warn">Verify your email to post. <a href="/verify">Verify now</a></div>;
  if (!open) return (
    <div className="card composer-collapsed">
      <button type="button" className="composer-prompt" onClick={() => setOpen(true)}>Post what you are building and who you need</button>
      <div className="row" style={{ gap: 6 }}>{TYPES.slice(0, 3).map((t) => <button key={t.value} type="button" className="chip chip-line" onClick={() => { setType(t.value); setOpen(true); }}>{t.label}</button>)}</div>
    </div>
  );
  return (
    <form className="card card-pad stack" onSubmit={submit} aria-label="Create a post">
      <div className="row between"><b>New post</b><button type="button" className="link-btn small" style={{ textDecoration: "none", color: "var(--slate)" }} onClick={() => setOpen(false)}>Close</button></div>
      <Segmented label="Post type" value={type} onChange={setType} options={TYPES.map((t) => ({ value: t.value, label: t.label }))} />
      <div className="stack-sm">
        <div className="row" style={{ alignItems: "center", gap: 8 }}>
          <label className="btn btn-ghost btn-sm" htmlFor="post-media-input" style={{ cursor: "pointer" }}>
            <ImageIcon size={15} aria-hidden /> Add photo
          </label>
          <label className="btn btn-ghost btn-sm" htmlFor="post-video-input" style={{ cursor: "pointer" }}>
            <Video size={15} aria-hidden /> Add short video
          </label>
          <input id="post-media-input" type="file" accept="image/*" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
          <input id="post-video-input" type="file" accept="video/*" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
          <span className="xs muted">Up to 3 uploads</span>
        </div>
        {mediaError && <div className="alert alert-warn" style={{ margin: 0 }}>{mediaError}</div>}
        {media.length > 0 && (
          <div className="stack-sm">
            {media.map((item) => (
              <div key={item.id} className="card card-pad-sm" style={{ borderColor: "var(--line)", background: "rgba(15,23,42,0.02)" }}>
                <div className="row between" style={{ alignItems: "center", gap: 12 }}>
                  <div className="row" style={{ gap: 6, alignItems: "center" }}>
                    {item.type === "image" ? <ImageIcon size={14} aria-hidden /> : <Video size={14} aria-hidden />}
                    <span className="small">{item.name}</span>
                  </div>
                  <button type="button" className="link-btn small" onClick={() => setMedia((prev) => prev.filter((m) => m.id !== item.id))}>Remove</button>
                </div>
                {item.type === "image" ? (
                  <div style={{ marginTop: 12, overflow: "hidden", borderRadius: 16, border: "1px solid var(--line)", background: "#0f172a" }}>
                    <img src={item.url} alt={item.name} style={{ display: "block", width: "100%", maxHeight: 240, objectFit: "cover", transform: `scale(${item.zoom})`, objectPosition: `${item.cropX}% ${item.cropY}%` }} />
                  </div>
                ) : (
                  <video src={item.url} controls muted playsInline style={{ width: "100%", maxHeight: 240, borderRadius: 12, marginTop: 12, background: "#0f172a" }} />
                )}
                {item.type === "image" && (
                  <div className="stack-sm" style={{ marginTop: 12 }}>
                    <label className="small muted" htmlFor={`zoom-${item.id}`}>Zoom {item.zoom.toFixed(2)}x</label>
                    <input id={`zoom-${item.id}`} type="range" min={1} max={2.2} step={0.05} value={item.zoom} onChange={(e) => updateMedia(item.id, { zoom: Number(e.target.value) })} />
                    <div className="row" style={{ gap: 10 }}>
                      <label className="small muted" style={{ flex: 1 }} htmlFor={`crop-x-${item.id}`}>Horizontal</label>
                      <input id={`crop-x-${item.id}`} type="range" min={0} max={100} value={item.cropX} onChange={(e) => updateMedia(item.id, { cropX: Number(e.target.value) })} style={{ flex: 1 }} />
                    </div>
                    <div className="row" style={{ gap: 10 }}>
                      <label className="small muted" style={{ flex: 1 }} htmlFor={`crop-y-${item.id}`}>Vertical</label>
                      <input id={`crop-y-${item.id}`} type="range" min={0} max={100} value={item.cropY} onChange={(e) => updateMedia(item.id, { cropY: Number(e.target.value) })} style={{ flex: 1 }} />
                    </div>
                  </div>
                )}
                {item.type === "video" && item.duration && (
                  <div className="stack-sm" style={{ marginTop: 12 }}>
                    <div className="row" style={{ gap: 10 }}>
                      <label className="small muted" htmlFor={`start-${item.id}`} style={{ width: 56 }}>Start</label>
                      <input id={`start-${item.id}`} type="range" min={0} max={Math.max(0, item.duration - 1)} step={0.25} value={item.start ?? 0} onChange={(e) => updateMedia(item.id, { start: Number(e.target.value), end: Math.max(Number(e.target.value) + 0.5, item.end ?? Number(e.target.value) + 0.5) })} style={{ flex: 1 }} />
                    </div>
                    <div className="row" style={{ gap: 10 }}>
                      <label className="small muted" htmlFor={`end-${item.id}`} style={{ width: 56 }}>End</label>
                      <input id={`end-${item.id}`} type="range" min={Math.max(0.5, item.start ?? 0.5)} max={item.duration} step={0.25} value={item.end ?? item.duration} onChange={(e) => updateMedia(item.id, { end: Number(e.target.value) })} style={{ flex: 1 }} />
                    </div>
                    <span className="xs muted">Clip: {item.start ?? 0}s to {item.end ?? item.duration}s</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Field label={type === "opportunity" ? "What are you trying to do, and who do you need?" : "What do you want to share?"} htmlFor="post-text">
        <textarea id="post-text" autoFocus className="textarea" rows={type === "opportunity" ? 4 : 3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)}
          placeholder={type === "opportunity" ? "I am testing a booking tool for yoga studios. I need a designer for two weekends to turn my sketches into a clickable prototype." : "Share progress, a demo or something you learned."} />
      </Field>
      {type === "opportunity" && (
        <div className="stack">
          <Field label="Goal"><Segmented label="Goal" value={goal} onChange={setGoal} options={GOALS.map((g) => ({ value: g, label: GOAL_LABEL[g] }))} /></Field>
          <Field label="How will people be rewarded?" help="Be honest. People decide based on this.">
            <div className="chips">{COMPENSATION.map((c) => <button type="button" key={c} className={`chip ${comp.includes(c) ? "chip-evidence" : ""}`} aria-pressed={comp.includes(c)} onClick={() => setComp(comp.includes(c) ? comp.filter((x) => x !== c) : [...comp, c])}>{COMP_LABEL[c]}</button>)}</div>
          </Field>
          <Field label="Skills you need"><SkillPicker value={skills} onChange={setSkills} max={8} id="opp-skills" /></Field>
          <Field label="Hours per week" optional htmlFor="opp-hours"><input id="opp-hours" className="input" type="number" min={1} max={40} value={hours} onChange={(e) => setHours(e.target.value)} style={{ maxWidth: 140 }} /></Field>
        </div>
      )}
      <details className="small"><summary style={{ cursor: "pointer", fontWeight: 600 }}>Add a link, tags or a project</summary><div className="stack" style={{ marginTop: 12 }}>
      <div className="grid grid-2">
        <Field label="Link" optional htmlFor="post-url"><div className="row-nowrap"><Link2 size={18} aria-hidden color="var(--slate)" /><input id="post-url" className="input" type="url" inputMode="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} /></div></Field>
        <Field label="Tags" optional help="Up to five, separated by spaces" htmlFor="post-tags"><input id="post-tags" className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="iot design" /></Field>
      </div>
      {prev && <div className="link-card" aria-label="Link preview"><div className="thumb" style={prev.image ? { backgroundImage: `url(${prev.image})` } : undefined} /><div className="meta"><span className="xs muted">{prev.siteName}</span><b className="clamp-2">{prev.title}</b>{prev.description && <span className="small muted clamp-2">{prev.description}</span>}</div></div>}
      {works.length > 0 && <Field label="Attach a project from your profile" optional htmlFor="post-work"><select id="post-work" className="select" value={workId} onChange={(e) => setWorkId(e.target.value)}><option value="">None</option>{works.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}</select></Field>}
      </div></details>
      <div className="row between"><span className="xs muted tnum">{text.length}/2000</span><button className="btn btn-primary" disabled={busy || text.trim().length < 3}>{busy ? <span className="spinner" /> : <><Send aria-hidden />Post</>}</button></div>
    </form>
  );
}
