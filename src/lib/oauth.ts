import crypto from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";

export type Provider = "google" | "github";
const cfg = {
  google: {
    auth: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
    id: () => process.env.GOOGLE_CLIENT_ID,
    secret: () => process.env.GOOGLE_CLIENT_SECRET,
  },
  github: {
    auth: "https://github.com/login/oauth/authorize",
    token: "https://github.com/login/oauth/access_token",
    scope: "read:user user:email",
    id: () => process.env.GITHUB_CLIENT_ID,
    secret: () => process.env.GITHUB_CLIENT_SECRET,
  },
} as const;

export const oauthConfigured = (p: Provider) => !!(cfg[p].id() && cfg[p].secret());
export const redirectUri = (p: Provider) => `${env.siteUrl}/api/auth/${p}/callback`;

export async function oauthStart(p: Provider, next?: string) {
  const c = cfg[p];
  const state = crypto.randomBytes(24).toString("base64url");
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  const jar = await cookies();
  const opts = { httpOnly: true, secure: env.isProd, sameSite: "lax" as const, path: "/", maxAge: 600 };
  jar.set(`oa_${p}`, JSON.stringify({ state, verifier, next: next || "" }), opts);
  const u = new URL(c.auth);
  u.searchParams.set("client_id", c.id()!);
  u.searchParams.set("redirect_uri", redirectUri(p));
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", c.scope);
  u.searchParams.set("state", state);
  u.searchParams.set("code_challenge", challenge);
  u.searchParams.set("code_challenge_method", "S256");
  if (p === "google") u.searchParams.set("prompt", "select_account");
  return u.toString();
}

export async function oauthFinish(p: Provider, code: string, state: string) {
  const jar = await cookies();
  const raw = jar.get(`oa_${p}`)?.value;
  jar.set(`oa_${p}`, "", { path: "/", maxAge: 0 });
  if (!raw) throw new Error("Sign-in session expired. Please try again.");
  const saved = JSON.parse(raw) as { state: string; verifier: string; next: string };
  if (saved.state !== state) throw new Error("Sign-in could not be verified. Please try again.");
  const c = cfg[p];
  const body = new URLSearchParams({
    client_id: c.id()!, client_secret: c.secret()!, code, redirect_uri: redirectUri(p), grant_type: "authorization_code", code_verifier: saved.verifier,
  });
  const tr = await fetch(c.token, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body });
  const tok = (await tr.json()) as { access_token?: string; error?: string };
  if (!tok.access_token) throw new Error("The provider did not complete sign-in.");

  if (p === "google") {
    const r = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tok.access_token}` } });
    const j = (await r.json()) as { sub: string; email: string; email_verified: boolean; name: string; picture?: string };
    return { next: saved.next, profile: { id: j.sub, email: j.email, emailVerified: !!j.email_verified, name: j.name, image: j.picture } };
  }
  const h = { Authorization: `Bearer ${tok.access_token}`, Accept: "application/vnd.github+json", "User-Agent": "skilion" };
  const [ur, er] = await Promise.all([fetch("https://api.github.com/user", { headers: h }), fetch("https://api.github.com/user/emails", { headers: h })]);
  const u = (await ur.json()) as { id: number; login: string; name?: string; avatar_url?: string };
  const emails = (await er.json()) as { email: string; primary: boolean; verified: boolean }[];
  const best = Array.isArray(emails) ? emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified) : undefined;
  if (!best) throw new Error("Your GitHub account has no verified email address.");
  return { next: saved.next, profile: { id: String(u.id), email: best.email, emailVerified: true, name: u.name || u.login, image: u.avatar_url }, githubLogin: u.login };
}
