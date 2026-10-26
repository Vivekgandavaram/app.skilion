import { NextResponse, type NextRequest } from "next/server";
import { oauthConfigured, oauthStart } from "@/lib/oauth";
import { safeNext } from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  if (!oauthConfigured("google")) return NextResponse.redirect(`${env.siteUrl}/login?error=google_not_configured`);
  const next = req.nextUrl.searchParams.get("next");
  const mobile = req.nextUrl.searchParams.get("mobile");
  const url = await oauthStart("google", next ? safeNext(next) : "", mobile);
  return NextResponse.redirect(url);
}
