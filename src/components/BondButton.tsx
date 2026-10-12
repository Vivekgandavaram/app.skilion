"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, Check, Clock, Ban } from "lucide-react";
import { api } from "@/lib/client";
import { Modal, useToast } from "./client-ui";

type State = "none" | "requested_by_me" | "requested_by_them" | "connected" | "declined" | "blocked";

/** Bond / pending / accept / bonded. Props are in docs/BUILD_CONTRACT.md. */
export default function BondButton({ userId, name }: { userId: string; name: string }) {
  const { toast } = useToast();
  const [state, setState] = useState<State | null>(null);
  const [bondId, setBondId] = useState<string>();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() { try { const j = await api.get(`/api/bonds/with/${userId}`); setState(j.state); setBondId(j.bondId); } catch { setState(null); } }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [userId]);
  if (state === null) return <span className="btn btn-ghost btn-sm" aria-hidden style={{ opacity: 0.5 }}>Bond</span>;

  async function send() {
    setBusy(true);
    try { const j = await api.post("/api/bonds", { toId: userId, note }); setState(j.state); setOpen(false); setNote(""); toast(j.accepted ? "You are now bonded." : "Request sent.", "ok"); await load(); }
    catch (e: any) { toast(e.message, "err"); } finally { setBusy(false); }
  }
  async function act(action: "accept" | "decline" | "cancel") {
    if (!bondId) return;
    setBusy(true);
    try { const j = await api.patch(`/api/bonds/${bondId}`, { action }); setState(j.state); toast(action === "accept" ? "Bonded. You can message now." : action === "cancel" ? "Request cancelled." : "Request declined.", "ok"); }
    catch (e: any) { toast(e.message, "err"); } finally { setBusy(false); }
  }

  if (state === "connected") return <span className="btn btn-soft btn-sm" aria-disabled><Check aria-hidden />Bonded</span>;
  if (state === "blocked") return <span className="btn btn-ghost btn-sm" aria-disabled><Ban aria-hidden />Unavailable</span>;
  if (state === "requested_by_me") return <button className="btn btn-ghost btn-sm" onClick={() => act("cancel")} disabled={busy} title="Cancel your request"><Clock aria-hidden />Request sent</button>;
  if (state === "requested_by_them") return <span className="row-nowrap"><button className="btn btn-primary btn-sm" onClick={() => act("accept")} disabled={busy}>Accept</button><button className="btn btn-ghost btn-sm" onClick={() => act("decline")} disabled={busy}>Decline</button></span>;
  return (
    <>
      <button className="btn btn-dark btn-sm" onClick={() => setOpen(true)}><UserPlus aria-hidden />Bond</button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Bond with ${name}`}>
        <div className="stack">
          <p className="muted small">A Bond is a mutual tie. Once accepted, you can message each other. Say what you want to build together.</p>
          <label className="label" htmlFor="bond-note">Your note</label>
          <textarea id="bond-note" className="textarea" maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} placeholder="I saw your sensor project. I am planning a four-week prototype and could use your help with the firmware, about 4 hours a week." />
          <div className="row between"><span className="xs muted tnum">{note.length}/280</span><div className="row"><button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={send} disabled={busy || note.trim().length < 10}>{busy ? <span className="spinner" /> : "Send request"}</button></div></div>
          <p className="xs muted">Requests expire after 30 days. <Link href="/guidelines">Community standards</Link> apply.</p>
        </div>
      </Modal>
    </>
  );
}
