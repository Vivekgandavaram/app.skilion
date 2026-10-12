import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError, type ZodTypeAny } from "zod";
import { getSessionUser } from "./auth";
import { checkRate, sameOrigin } from "./security";
import type { UserDoc } from "./types";
import { env } from "./env";

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}
export const bad = (m: string, code?: string) => new HttpError(400, m, code);
export const forbidden = (m = "You do not have access to this.") => new HttpError(403, m);
export const notFound = (m = "Not found") => new HttpError(404, m);

type Ctx<P> = { req: NextRequest; user: UserDoc; params: P; ip: string };
type Opts = {
  /** true: any signed-in user. "admin": admin only. "mod": moderator or admin. false: public */
  auth?: boolean | "admin" | "mod";
  rate?: { key: string; limit: number; windowSec: number };
  /** require verified email for the action */
  verified?: boolean;
};

export function ipOf(req: NextRequest) {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "0.0.0.0";
}

/**
 * Route wrapper: auth, CSRF origin check, rate limit, uniform JSON errors.
 *   export const POST = route({auth:true, rate:{...}}, async ({req,user}) => ({ok:true}))
 */
export function route<P = Record<string, string>>(opts: Opts, handler: (c: Ctx<P> & { user: UserDoc }) => Promise<unknown | Response>) {
  return async (req: NextRequest, ctx: { params: Promise<P> }) => {
    try {
      if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && !sameOrigin(req)) throw new HttpError(403, "Cross-site request blocked");
      const ip = ipOf(req);
      let user: UserDoc | null = null;
      if (opts.auth) {
        user = await getSessionUser();
        if (!user) throw new HttpError(401, "Please sign in to continue.", "unauthenticated");
        if (user.status === "suspended") throw new HttpError(403, "This account is suspended.", "suspended");
        if (opts.auth === "admin" && user.role !== "admin") throw forbidden();
        if (opts.auth === "mod" && user.role !== "admin" && user.role !== "moderator") throw forbidden();
        if (opts.verified && !user.emailVerified) throw new HttpError(403, "Verify your email to do this.", "unverified");
      }
      if (opts.rate) {
        const key = `${opts.rate.key}:${user ? user._id.toString() : ip}`;
        const r = await checkRate(key, opts.rate.limit, opts.rate.windowSec);
        if (!r.ok) throw new HttpError(429, `Too many attempts. Try again in ${Math.ceil(r.retryAfter / 60) || 1} min.`, "rate_limited");
      }
      const params = (await ctx?.params) as P;
      const out = await handler({ req, user: user as UserDoc, params, ip });
      if (out instanceof Response) return out;
      return NextResponse.json(out ?? { ok: true }, { headers: { "Cache-Control": "no-store" } });
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
      if (e instanceof ZodError) {
        return NextResponse.json({ error: e.issues[0]?.message ? `${e.issues[0].path.join(".") || "input"}: ${e.issues[0].message}` : "Invalid input", code: "invalid" }, { status: 400 });
      }
      if (String((e as Error)?.message).includes("MONGODB_URI is not set")) return NextResponse.json({ error: "The database is not configured yet. Add MONGODB_URI (see README).", code: "setup_required" }, { status: 503 });
      console.error("[api]", req.method, req.nextUrl.pathname, e);
      return NextResponse.json({ error: env.isProd ? "Something went wrong. Please try again." : String((e as Error)?.message || e) }, { status: 500 });
    }
  };
}

export async function body<S extends ZodTypeAny>(req: NextRequest, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw bad("Invalid JSON body");
  }
  return schema.parse(raw);
}
export function query(req: NextRequest) {
  return Object.fromEntries(req.nextUrl.searchParams.entries());
}
export const ok = (extra: Record<string, unknown> = {}) => ({ ok: true, ...extra });
