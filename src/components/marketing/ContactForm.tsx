"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { Field } from "@/components/client-ui";

const TOPICS = ["Support", "Partnership", "Enterprise", "Press", "Report a security issue", "Appeal a decision"];
const MAP: Record<string, string> = { support: "Support", partnership: "Partnership", enterprise: "Enterprise", press: "Press", security: "Report a security issue", appeal: "Appeal a decision" };

export default function ContactForm({ initialTopic }: { initialTopic?: string }) {
  const [topic, setTopic] = useState(MAP[initialTopic || ""] || "Support");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("busy"); setErr("");
    try {
      await api.post("/api/contact", { name: f.get("name"), email: f.get("email"), topic, message: f.get("message"), website: f.get("website") });
      setState("done");
    } catch (x: any) { setErr(x.message); setState("idle"); }
  }
  if (state === "done") return <div className="alert alert-ok" role="status"><span>Thanks. Your message was sent. We reply to the email you gave, usually within two working days.</span></div>;
  return (
    <form className="mk-form" onSubmit={submit} noValidate>
      <div className="grid grid-2">
        <Field label="Name" htmlFor="c-name"><input id="c-name" name="name" className="input" required maxLength={80} autoComplete="name" /></Field>
        <Field label="Email" htmlFor="c-email"><input id="c-email" name="email" type="email" className="input" required maxLength={160} autoComplete="email" /></Field>
      </div>
      <Field label="Topic" htmlFor="c-topic"><select id="c-topic" className="select" value={topic} onChange={(e) => setTopic(e.target.value)}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Message" htmlFor="c-msg" help={topic === "Report a security issue" ? "Describe the issue and how to reproduce it. Do not include real user data." : undefined}><textarea id="c-msg" name="message" className="textarea" required minLength={10} maxLength={4000} /></Field>
      <div className="mk-hp" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {err && <div className="alert alert-error" role="alert">{err}</div>}
      <button className="btn btn-primary" disabled={state === "busy"} style={{ justifySelf: "start" }}>{state === "busy" ? <span className="spinner" /> : "Send message"}</button>
    </form>
  );
}
