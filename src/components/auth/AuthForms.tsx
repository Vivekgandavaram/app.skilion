"use client";
import "./auth.css";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/client";
import { Field } from "@/components/client-ui";
import { GoogleIcon, GitHubIcon } from "@/components/BrandIcons";

const ERRORS: Record<string, string> = {
  google_not_configured: "Google sign-in is not set up on this server yet. Use email, or ask the site owner to add the Google keys.",
  github_not_configured: "GitHub sign-in is not set up on this server yet. Use email, or ask the site owner to add the GitHub keys.",
  oauth_failed: "We could not complete that sign-in. Please try again.",
  oauth_cancelled: "Sign-in was cancelled.",
  rate_limited: "Too many attempts. Please wait a few minutes.",
  suspended: "This account is suspended. You can appeal from the contact page.",
};

function strength(p: string) { let s = 0; if (p.length >= 8) s++; if (/[A-Za-z]/.test(p) && /\d/.test(p)) s++; if (p.length >= 12 && /[^A-Za-z0-9]/.test(p)) s++; return s; }

export function PasswordInput({ id, value, onChange, autoComplete, meter, invalid }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string; meter?: boolean; invalid?: boolean }) {
  const [show, setShow] = useState(false);
  const s = strength(value);
  return (
    <div>
      <div className="pw-wrap">
        <input id={id} className="input" type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} required aria-invalid={invalid || undefined} />
        <button type="button" className="icon-btn pw-toggle" style={{ width: 36, height: 36, border: 0 }} onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
      </div>
      {meter && value && <div className="pw-meter" aria-hidden><i className={s >= 1 ? "on1" : ""} /><i className={s >= 2 ? "on2" : ""} /><i className={s >= 3 ? "on3" : ""} /></div>}
    </div>
  );
}

export function OAuthButtons({ next }: { next?: string }) {
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <div className="stack-sm">
      <a className="oauth-btn" href={`/api/auth/google/start${q}`}><GoogleIcon /> Continue with Google</a>
      <a className="oauth-btn" href={`/api/auth/github/start${q}`}><GitHubIcon /> Continue with GitHub</a>
    </div>
  );
}

function useQ() { const sp = useSearchParams(); return { next: sp.get("next") || "", error: sp.get("error") || "", email: sp.get("email") || "", goal: sp.get("goal") || "" }; }

export function LoginForm() {
  const r = useRouter();
  const { next, error: qerr } = useQ();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(qerr ? ERRORS[qerr] || "Sign-in failed." : "");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const j = await api.post("/api/auth/login", { email, password });
      if (j.needsVerify) return r.push(`/verify?email=${encodeURIComponent(j.email)}${j.devCode ? `&dev=${j.devCode}` : ""}`);
      if (j.mfa) return r.push(`/verify?mode=mfa&email=${encodeURIComponent(j.email)}${j.devCode ? `&dev=${j.devCode}` : ""}${next ? `&next=${encodeURIComponent(next)}` : ""}`);
      window.location.href = next && j.next !== "/onboarding" ? next : j.next;
    } catch (x: any) { setErr(x.message); setBusy(false); }
  }
  return (
    <div className="stack">
      <OAuthButtons next={next} />
      <div className="divider-text">or use your email</div>
      <form className="stack" onSubmit={submit} noValidate>
        {err && <div className="alert alert-error" role="alert">{err}</div>}
        <Field label="Email" htmlFor="li-email"><input id="li-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
        <Field label="Password" htmlFor="li-pw"><PasswordInput id="li-pw" value={password} onChange={setPassword} autoComplete="current-password" /></Field>
        <div className="row between"><span /><Link href="/forgot" className="small">Forgot password?</Link></div>
        <button className="btn btn-dark btn-block btn-lg" disabled={busy}>{busy ? <span className="spinner" /> : "Log in"}</button>
      </form>
    </div>
  );
}

export function SignupForm() {
  const r = useRouter();
  const { next, goal } = useQ();
  const [f, setF] = useState({ name: "", email: "", password: "" }); const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const set = (k: string) => (v: string) => setF({ ...f, [k]: v });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (!agree) return setErr("Please accept the terms and privacy policy to continue.");
    setBusy(true);
    try {
      const j = await api.post("/api/auth/signup", f);
      try { if (goal) sessionStorage.setItem("sk_goal", goal); } catch {}
      r.push(`/verify?email=${encodeURIComponent(j.email)}${j.devCode ? `&dev=${j.devCode}` : ""}`);
    } catch (x: any) { setErr(x.message); setBusy(false); }
  }
  return (
    <div className="stack">
      <OAuthButtons next={next} />
      <div className="divider-text">or sign up with email</div>
      <form className="stack" onSubmit={submit} noValidate>
        {err && <div className="alert alert-error" role="alert">{err}</div>}
        <Field label="Full name" htmlFor="su-name"><input id="su-name" className="input" value={f.name} onChange={(e) => set("name")(e.target.value)} autoComplete="name" required /></Field>
        <Field label="Email" htmlFor="su-email"><input id="su-email" className="input" type="email" value={f.email} onChange={(e) => set("email")(e.target.value)} autoComplete="email" required /></Field>
        <Field label="Password" htmlFor="su-pw" help="At least 8 characters with a letter and a number."><PasswordInput id="su-pw" value={f.password} onChange={set("password")} autoComplete="new-password" meter /></Field>
        <label className="check small"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span>I am 18 or older and agree to the <Link href="/terms" target="_blank">Terms</Link> and <Link href="/privacy" target="_blank">Privacy policy</Link>.</span></label>
        <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? <span className="spinner" /> : "Create account"}</button>
      </form>
    </div>
  );
}

export function VerifyForm() {
  const r = useRouter();
  const sp = useSearchParams();
  const email = sp.get("email") || ""; const mfa = sp.get("mode") === "mfa"; const next = sp.get("next") || "";
  const [code, setCode] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [info, setInfo] = useState("");
  const [wait, setWait] = useState(30); const [dev, setDev] = useState(sp.get("dev") || "");
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);
  async function submit(e?: React.FormEvent) {
    e?.preventDefault(); if (code.length !== 6) return setErr("Enter the 6-digit code."); setBusy(true); setErr("");
    try {
      const j = await api.post(mfa ? "/api/auth/mfa" : "/api/auth/verify", { email, code });
      window.location.href = next && j.next !== "/onboarding" ? next : j.next;
    } catch (x: any) { setErr(x.message); setBusy(false); }
  }
  async function resend() {
    setInfo(""); setErr("");
    try { const j = await api.post("/api/auth/resend", { email, purpose: mfa ? "mfa" : "verify" }); setWait(j.wait || 60); if (j.devCode) setDev(j.devCode); setInfo("A new code is on its way."); } catch (x: any) { setErr(x.message); }
  }
  if (!email) return <div className="alert alert-info">Open this page from the sign-up or log-in screen so we know which email to verify. <Link href="/signup">Go to sign up</Link></div>;
  return (
    <form className="stack" onSubmit={submit} noValidate>
      <p className="muted">We sent a 6-digit code to <b>{email}</b>. It expires in 10 minutes.</p>
      {dev && <div className="alert alert-warn"><span>Development mode: email is not configured, so your code is <b className="tnum">{dev}</b>.</span></div>}
      {err && <div className="alert alert-error" role="alert">{err}</div>}
      {info && <div className="alert alert-ok" role="status">{info}</div>}
      <Field label="Verification code" htmlFor="v-code"><input id="v-code" className="input otp-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); setCode(v); }} autoFocus /></Field>
      <button className="btn btn-primary btn-block btn-lg" disabled={busy || code.length !== 6}>{busy ? <span className="spinner" /> : mfa ? "Sign in" : "Verify email"}</button>
      <div className="row between small"><button type="button" className="link-btn" onClick={resend} disabled={wait > 0}>{wait > 0 ? `Resend code in ${wait}s` : "Resend code"}</button><Link href="/login">Back to log in</Link></div>
    </form>
  );
}

export function ForgotForm() {
  const r = useRouter();
  const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try { const j = await api.post("/api/auth/forgot", { email }); r.push(`/reset?email=${encodeURIComponent(email)}${j.devCode ? `&dev=${j.devCode}` : ""}`); } catch (x: any) { setErr(x.message); setBusy(false); }
  }
  return (
    <form className="stack" onSubmit={submit} noValidate>
      {err && <div className="alert alert-error" role="alert">{err}</div>}
      <Field label="Email" htmlFor="f-email"><input id="f-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
      <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? <span className="spinner" /> : "Send reset code"}</button>
    </form>
  );
}

export function ResetForm() {
  const sp = useSearchParams();
  const [email, setEmail] = useState(sp.get("email") || ""); const [code, setCode] = useState(""); const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const dev = sp.get("dev");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try { const j = await api.post("/api/auth/reset", { email, code, password: pw }); window.location.href = j.next; } catch (x: any) { setErr(x.message); setBusy(false); }
  }
  return (
    <form className="stack" onSubmit={submit} noValidate>
      <p className="muted">If an account exists for that email, we sent a 6-digit code.</p>
      {dev && <div className="alert alert-warn"><span>Development mode: your code is <b>{dev}</b>.</span></div>}
      {err && <div className="alert alert-error" role="alert">{err}</div>}
      <Field label="Email" htmlFor="r-email"><input id="r-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
      <Field label="Code" htmlFor="r-code"><input id="r-code" className="input otp-input" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" /></Field>
      <Field label="New password" htmlFor="r-pw" help="At least 8 characters with a letter and a number."><PasswordInput id="r-pw" value={pw} onChange={setPw} autoComplete="new-password" meter /></Field>
      <button className="btn btn-primary btn-block btn-lg" disabled={busy || code.length !== 6}>{busy ? <span className="spinner" /> : "Set password and sign in"}</button>
    </form>
  );
}
