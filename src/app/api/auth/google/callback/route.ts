import { NextResponse, type NextRequest } from "next/server";
import { oauthFinish } from "@/lib/oauth";
import { upsertOAuthUser, setSession, safeNext } from "@/lib/auth";
import { col } from "@/lib/db";
import { env } from "@/lib/env";
import { checkRate } from "@/lib/security";
import { ipOf } from "@/lib/api";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const fail = (e: string) => NextResponse.redirect(`${env.siteUrl}/login?error=${e}`);
  const sp = req.nextUrl.searchParams;
  if (sp.get("error") || !sp.get("code") || !sp.get("state")) return fail("oauth_cancelled");
  try {
    if (!(await checkRate(`oauth:${ipOf(req)}`, 30, 900)).ok) return fail("rate_limited");
    const r: any = await oauthFinish("google", sp.get("code")!, sp.get("state")!);
    const u = await upsertOAuthUser("google", r.profile);
    if (u.status === "suspended") return fail("suspended");
    if (r.githubLogin) {
      const users = await col("users");
      await users.updateOne({ _id: u._id }, { $set: { "providers.githubLogin": r.githubLogin, updatedAt: new Date() } });
    }
    await setSession(u._id.toString());
    const dest = u.onboarded ? safeNext(r.next || "/discover") : "/onboarding";
    return NextResponse.redirect(`${env.siteUrl}${dest}`);
  } catch (e) {
    console.error("oauth google", (e as Error).message);
    return fail("oauth_failed");
  }
}
