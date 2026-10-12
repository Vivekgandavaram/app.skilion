import type { NextRequest } from "next/server";
import dns from "node:dns/promises";
import net from "node:net";
import { col } from "./db";
import { env } from "./env";

export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetches from some browsers omit it; cookies are SameSite=Lax anyway
  try {
    const o = new URL(origin);
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (o.host === host) return true;
    return new URL(env.siteUrl).host === o.host;
  } catch {
    return false;
  }
}

/** Fixed-window rate limiter stored in Mongo (works on serverless). */
export async function checkRate(key: string, limit: number, windowSec: number): Promise<{ ok: boolean; retryAfter: number }> {
  const c = await col("rateLimits");
  const now = Date.now();
  const resetAt = new Date(now + windowSec * 1000);
  const doc = await c.findOneAndUpdate(
    { _id: key, resetAt: { $gt: new Date(now) } },
    { $inc: { count: 1 } },
    { returnDocument: "after" },
  );
  if (doc) return { ok: doc.count <= limit, retryAfter: Math.max(1, Math.ceil((doc.resetAt.getTime() - now) / 1000)) };
  try {
    await c.replaceOne({ _id: key }, { _id: key, count: 1, resetAt }, { upsert: true });
  } catch {}
  return { ok: true, retryAfter: windowSec };
}

/* ---------------- SSRF-safe URL fetching (link previews) ---------------- */
function privateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    return l === "::1" || l === "::" || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe80") || l.startsWith("::ffff:127.") || l.startsWith("::ffff:10.") || l.startsWith("::ffff:192.168.") || l.startsWith("::ffff:169.254.");
  }
  return true;
}

export async function assertPublicUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("That does not look like a valid link.");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Only http and https links are allowed.");
  if (u.username || u.password) throw new Error("Links with credentials are not allowed.");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("That link points to a private address.");
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw new Error("That link points to a private address.");
  return u;
}

/** fetch with manual, validated redirects, size cap and timeout */
export async function safeFetchText(raw: string, opts: { maxBytes?: number; timeoutMs?: number; maxRedirects?: number } = {}) {
  const { maxBytes = 400_000, timeoutMs = 6000, maxRedirects = 3 } = opts;
  let url = await assertPublicUrl(raw);
  for (let i = 0; i <= maxRedirects; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        redirect: "manual",
        signal: ctrl.signal,
        headers: { "user-agent": "SkilionLinkPreview/1.0 (+https://skilion.vigotech.in)", accept: "text/html,application/xhtml+xml" },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        url = await assertPublicUrl(new URL(res.headers.get("location")!, url).toString());
        continue;
      }
      const type = res.headers.get("content-type") || "";
      if (!/text\/html|application\/xhtml/.test(type)) return { url: url.toString(), html: "", status: res.status };
      const reader = res.body?.getReader();
      let received = 0;
      const chunks: Uint8Array[] = [];
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.length;
        chunks.push(value);
        if (received > maxBytes) {
          await reader.cancel();
          break;
        }
      }
      return { url: url.toString(), html: Buffer.concat(chunks).toString("utf8"), status: res.status };
    } finally {
      clearTimeout(t);
    }
  }
  throw new Error("Too many redirects.");
}
