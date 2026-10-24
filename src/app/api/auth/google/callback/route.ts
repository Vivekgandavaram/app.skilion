import { NextResponse, type NextRequest } from "next/server";
import { oauthFinish } from "@/lib/oauth";
import { upsertOAuthUser, setSession, safeNext } from "@/lib/auth";
import { col } from "@/lib/db";
import { env } from "@/lib/env";
import { checkRate } from "@/lib/security";
import { ipOf } from "@/lib/api";
import { issueMobileCode } from "@/app/api/auth/mobile/oauth/exchange/route";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const fail = (e: string) => NextResponse.redirect(`${env.siteUrl}/login?error=${e}`);
  const sp = req.nextUrl.searchParams;
  if (sp.get("error") || !sp.get("code") || !sp.get("state")) return fail("oauth_cancelled");
  try {
    if (!(await checkRate(`oauth:${ipOf(req)}`, 30, 900)).ok) return fail("rate_limited");
    const r: any = await oauthFinish("google", sp.get("code")!, sp.get("state")!);
    const savedCookie = req.cookies.get("oa_google")?.value;
    let saved: any = null;
    try { if (savedCookie) saved = JSON.parse(savedCookie); } catch {}
    const u = await upsertOAuthUser("google", r.profile);
    if (u.status === "suspended") return fail("suspended");
    if (r.githubLogin) {
      const users = await col("users");
      await users.updateOne({ _id: u._id }, { $set: { "providers.githubLogin": r.githubLogin, updatedAt: new Date() } });
    }
    if (saved?.mobile === "1") {
      const code = issueMobileCode(u._id.toString());
      return NextResponse.redirect(`skilion://auth?code=${encodeURIComponent(code)}`);
    }
    await setSession(u._id.toString());
    const dest = u.onboarded ? safeNext(r.next || "/discover") : "/onboarding";
    return NextResponse.redirect(`${env.siteUrl}${dest}`);
  } catch (e) {
    console.error("oauth google", (e as Error).message);
    return fail("oauth_failed");
  }
}
