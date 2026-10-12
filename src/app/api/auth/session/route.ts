import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
/** Lightweight session probe used by static marketing pages. */
export async function GET() {
  try {
    const u = await getSessionUser();
    return NextResponse.json({ user: u ? { id: u._id.toString(), name: u.name, handle: u.handle, image: u.image ?? null, onboarded: u.onboarded } : null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ user: null }, { headers: { "Cache-Control": "no-store" } });
  }
}
