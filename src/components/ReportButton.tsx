"use client";
import { useState } from "react";
import { Flag } from "lucide-react";
import { api } from "@/lib/client";
import { Modal, useToast, Field } from "./client-ui";

const REASONS = ["Spam or advertising", "Harassment or abuse", "Fake profile or impersonation", "Scam, phishing or malware", "Misleading proof of work", "Other"];

/** Report any item (spec TRUST-03). target.type: user | post | message | project | comment */
export default function ReportButton({ target, label = "Report", className = "act-btn", controlled }: { controlled?: { open: boolean; onClose: () => void }; target: { type: "user" | "post" | "message" | "project" | "comment"; id: string }; label?: string; className?: string }) {
  const [openLocal, setOpenLocal] = useState(false);
  const open = controlled ? controlled.open : openLocal;
  const setOpen = (v: boolean) => (controlled ? (!v && controlled.onClose()) : setOpenLocal(v));
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const submit = async () => {
    setBusy(true);
    try { await api.post("/api/reports", { target, reason, details }); toast("Report sent. A moderator will review it within 24 hours.", "ok"); setOpen(false); setDetails(""); }
    catch (e: any) { toast(e.message, "err"); } finally { setBusy(false); }
  };
  return (
    <>
      {!controlled && <button type="button" className={className} onClick={() => setOpen(true)}><Flag size={14} aria-hidden />{label}</button>}
      <Modal open={open} onClose={() => setOpen(false)} title="Report this">
        <div className="stack">
          <Field label="Reason" htmlFor="rep-reason"><select id="rep-reason" className="select" value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field label="Details" optional htmlFor="rep-details"><textarea id="rep-details" className="textarea" maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="What happened? Links or quotes help." /></Field>
          <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? <span className="spinner" /> : "Send report"}</button></div>
        </div>
      </Modal>
    </>
  );
}
