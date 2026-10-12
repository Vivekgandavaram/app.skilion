"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, ThumbsUp } from "lucide-react";
import { api } from "@/lib/client";
import { ConfirmDialog, Modal, Field, useToast } from "@/components/client-ui";

export function BlockButton({ userId, name }: { userId: string; name: string }) {
  const { toast } = useToast(); const r = useRouter(); const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false);
  async function go() { setBusy(true); try { await api.post("/api/blocks", { userId }); toast(`${name} is blocked.`, "ok"); r.push("/discover"); } catch (e: any) { toast(e.message, "err"); setBusy(false); } }
  return (<><button className="act-btn" onClick={() => setOpen(true)}><Ban aria-hidden />Block</button>
    <ConfirmDialog open={open} onClose={() => setOpen(false)} title={`Block ${name}?`} body="They will not be able to message or bond with you, and you will not see each other in search. You can unblock in Settings, Privacy." confirmLabel="Block" danger busy={busy} onConfirm={go} /></>);
}

export function EndorseButton({ userId, name, skills }: { userId: string; name: string; skills: string[] }) {
  const { toast } = useToast(); const r = useRouter();
  const [open, setOpen] = useState(false); const [skill, setSkill] = useState(skills[0] || ""); const [text, setText] = useState(""); const [busy, setBusy] = useState(false);
  async function go() { setBusy(true); try { await api.post("/api/endorsements", { toId: userId, skill, text }); toast("Endorsement added.", "ok"); setOpen(false); setText(""); r.refresh(); } catch (e: any) { toast(e.message, "err"); } finally { setBusy(false); } }
  if (!skills.length) return null;
  return (<><button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}><ThumbsUp aria-hidden />Endorse</button>
    <Modal open={open} onClose={() => setOpen(false)} title={`Endorse ${name}`}><div className="stack">
      <p className="small muted">Only endorse what you have seen first-hand. You can endorse people you are bonded with or have worked with. An endorsement is an opinion, not a credential check.</p>
      <Field label="Skill" htmlFor="end-skill"><select id="end-skill" className="select" value={skill} onChange={(e) => setSkill(e.target.value)}>{skills.map((s) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="What did you see?" htmlFor="end-text"><textarea id="end-text" className="textarea" rows={3} maxLength={300} value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={busy || text.trim().length < 10} onClick={go}>Endorse</button></div></div></Modal></>);
}
