"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { Field } from "@/components/client-ui";
export default function AppealForm() {
  const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); const [state, setState] = useState<"idle" | "busy" | "done">("idle"); const [err, setErr] = useState("");
  async function go(e: React.FormEvent) { e.preventDefault(); setState("busy"); setErr(""); try { await api.post("/api/appeals", { email, message }); setState("done"); } catch (er: any) { setErr(er.message); setState("idle"); } }
  if (state === "done") return <div className="alert alert-info" role="status"><span>Thank you. A person on the Skilion team will review this and reply by email.</span></div>;
  return (
    <form className="card card-pad stack" onSubmit={go}>
      {err && <div className="alert alert-warn" role="alert">{err}</div>}
      <Field label="Email on the account" htmlFor="ap-e"><input id="ap-e" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field label="What would you like us to review?" htmlFor="ap-m"><textarea id="ap-m" className="textarea" rows={6} required minLength={20} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} /></Field>
      <div><button className="btn btn-primary" disabled={state === "busy"}>{state === "busy" ? <span className="spinner" /> : "Send appeal"}</button></div>
    </form>
  );
}
