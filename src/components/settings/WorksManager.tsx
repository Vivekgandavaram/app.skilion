"use client";
import { useState } from "react";
import useSWR from "swr";
import { Plus, Pencil, Trash2, BadgeCheck } from "lucide-react";
import { api, fetcher } from "@/lib/client";
import { Field, Modal, Segmented, ConfirmDialog, Skeleton, useToast } from "@/components/client-ui";
import SkillPicker from "@/components/SkillPicker";

const BLANK = { title: "", role: "", kind: "personal", summary: "", tech: [] as string[], demo: "", repo: "", outcome: "", visibility: "public" };

export default function WorksManager({ hasGithub, emailVerified }: { hasGithub: boolean; emailVerified: boolean }) {
  const { toast } = useToast();
  const { data, mutate, isLoading } = useSWR("/api/works", fetcher);
  const reqs = useSWR("/api/me/verification-requests", fetcher);
  const [edit, setEdit] = useState<any | null>(null); const [busy, setBusy] = useState(false); const [del, setDel] = useState<any | null>(null);
  const [idEv, setIdEv] = useState(""); const [idOpen, setIdOpen] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const body = { title: edit.title, role: edit.role, kind: edit.kind, summary: edit.summary || undefined, tech: edit.tech, outcome: edit.outcome || undefined, visibility: edit.visibility, links: { demo: edit.demo || "", repo: edit.repo || "" } };
    try { if (edit.id) await api.put(`/api/works/${edit.id}`, body); else await api.post("/api/works", body); setEdit(null); mutate(); toast("Saved.", "ok"); } catch (er: any) { toast(er.message, "err"); } finally { setBusy(false); }
  }
  async function verify(id: string) { try { await api.post(`/api/works/${id}/verify-repo`); mutate(); toast("Repository ownership checked.", "ok"); } catch (e: any) { toast(e.message, "err"); } }
  async function remove() { try { await api.del(`/api/works/${del.id}`); setDel(null); mutate(); } catch (e: any) { toast(e.message, "err"); } }
  async function reqId() { try { await api.post("/api/me/verification-requests", { type: "identity", evidence: idEv }); toast("Request sent. A verifier will review it.", "ok"); setIdOpen(false); setIdEv(""); reqs.mutate(); } catch (e: any) { toast(e.message, "err"); } }
  return (
    <div className="stack-lg">
      <div className="row between"><p className="muted small" style={{ maxWidth: 560 }}>Projects are your proof. Skills that match a project show as evidence on your profile. Private projects count as evidence only for you.</p>
        <button className="btn btn-primary" onClick={() => setEdit({ ...BLANK })}><Plus aria-hidden />Add project</button></div>
      {isLoading && <Skeleton h={100} />}
      {data && !data.items.length && <div className="empty"><h3 className="h3">No projects yet</h3><p className="muted" style={{ maxWidth: 440 }}>Add something you built, even small. A weekend app, a design, a research report. Say what your role was.</p></div>}
      {data?.items.map((w: any) => (
        <div key={w.id} className="card card-pad stack-sm">
          <div className="row between"><b>{w.title}</b><span className="row"><span className="chip chip-line">{w.visibility}</span>{w.repoVerified && <span className="chip chip-ok"><BadgeCheck aria-hidden />Repository owner checked</span>}</span></div>
          <div className="small muted">{w.role} · {w.kind}</div>
          <div className="chips">{w.tech.map((t: string) => <span key={t} className="chip chip-line">{t}</span>)}</div>
          <div className="row">
            <button className="btn btn-ghost btn-sm" onClick={() => setEdit({ id: w.id, title: w.title, role: w.role, kind: w.kind, summary: w.summary || "", tech: w.tech, demo: w.links?.demo || "", repo: w.links?.repo || "", outcome: w.outcome || "", visibility: w.visibility })}><Pencil aria-hidden />Edit</button>
            {w.links?.repo && !w.repoVerified && <button className="btn btn-soft btn-sm" onClick={() => verify(w.id)} title={hasGithub ? "" : "Link GitHub in Security first"}>Verify repository owner</button>}
            <button className="btn btn-ghost btn-sm" onClick={() => setDel(w)}><Trash2 aria-hidden />Delete</button>
          </div>
        </div>))}
      <section className="card card-pad stack"><h2 className="h3">Identity check</h2><p className="small muted">Optional. A Skilion verifier reviews what you send and, if it checks out, adds an “Identity checked” badge. The badge says only that: it is not a background check.</p>
        {reqs.data?.items.map((r: any) => <div key={r.id} className="small">{r.type} request: <b>{r.status}</b>{r.note ? ` (${r.note})` : ""}</div>)}
        <div><button className="btn btn-ghost" disabled={!emailVerified} onClick={() => setIdOpen(true)}>Request an identity check</button></div></section>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit project" : "Add project"} wide>
        {edit && <form className="stack" onSubmit={submit}>
          <div className="grid grid-2"><Field label="Title" htmlFor="w-t"><input id="w-t" className="input" required minLength={2} maxLength={100} value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            <Field label="Your role" htmlFor="w-r"><input id="w-r" className="input" required minLength={2} maxLength={80} value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })} placeholder="Firmware developer" /></Field></div>
          <Field label="Type"><Segmented label="Type" value={edit.kind} onChange={(v) => setEdit({ ...edit, kind: v })} options={[{ value: "personal", label: "Personal" }, { value: "collaborative", label: "With others" }, { value: "client", label: "For a client" }]} /></Field>
          <Field label="What is it?" optional htmlFor="w-s"><textarea id="w-s" className="textarea" rows={3} maxLength={600} value={edit.summary} onChange={(e) => setEdit({ ...edit, summary: e.target.value })} /></Field>
          <Field label="Skills and tools used"><SkillPicker id="w-tech" value={edit.tech} max={15} onChange={(v) => setEdit({ ...edit, tech: v })} /></Field>
          <div className="grid grid-2"><Field label="Demo link" optional htmlFor="w-d"><input id="w-d" className="input" type="url" placeholder="https://" value={edit.demo} onChange={(e) => setEdit({ ...edit, demo: e.target.value })} /></Field>
            <Field label="Repository link" optional htmlFor="w-p"><input id="w-p" className="input" type="url" placeholder="https://github.com/you/project" value={edit.repo} onChange={(e) => setEdit({ ...edit, repo: e.target.value })} /></Field></div>
          <Field label="Outcome" optional htmlFor="w-o" help="What happened because of it? Numbers only if they are real."><input id="w-o" className="input" maxLength={400} value={edit.outcome} onChange={(e) => setEdit({ ...edit, outcome: e.target.value })} /></Field>
          <Field label="Visibility"><Segmented label="Visibility" value={edit.visibility} onChange={(v) => setEdit({ ...edit, visibility: v })} options={[{ value: "public", label: "Shown on my profile" }, { value: "private", label: "Only me" }]} /></Field>
          <div className="row" style={{ justifyContent: "flex-end" }}><button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary" disabled={busy}>Save project</button></div>
        </form>}
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Delete this project?" body="Skills that relied on it lose their evidence marker." confirmLabel="Delete" danger onConfirm={remove} />
      <Modal open={idOpen} onClose={() => setIdOpen(false)} title="Identity check"><div className="stack"><Field label="How can we confirm you?" htmlFor="idev" help="For example, a link to a public profile that names you and links back here, or a note on how a verifier can reach you. Never paste ID numbers."><textarea id="idev" className="textarea" rows={4} maxLength={1500} value={idEv} onChange={(e) => setIdEv(e.target.value)} /></Field><div className="row" style={{ justifyContent: "flex-end" }}><button className="btn btn-primary" disabled={idEv.trim().length < 10} onClick={reqId}>Send request</button></div></div></Modal>
    </div>
  );
}
