import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED = ["/build", "/team", "/messages", "/projects", "/notifications", "/settings", "/admin", "/onboarding", "/invites", "/network"];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();
  const token = req.cookies.get("sk_session")?.value;
  let ok = false;
  if (token) {
    try {
      const secret = process.env.AUTH_SECRET || (process.env.NODE_ENV !== "production" ? "dev-only-secret-change-me-please-1234567890" : "");
      await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
      ok = true;
    } catch {}
  }
  if (ok) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}
export const config = { matcher: ["/((?!api|_next|brand|illustrations|favicon|.*\\..*).*)"] };
