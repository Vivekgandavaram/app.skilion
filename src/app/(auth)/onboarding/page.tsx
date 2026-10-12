import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { selfView } from "@/lib/serialize";
import Onboarding from "@/components/auth/Onboarding";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Set up your profile", path: "/onboarding", noindex: true });

export default async function Page() {
  const user = await requireUser("/onboarding");
  return (
    <div style={{ background: "var(--pale)", minHeight: "100dvh" }}>
      <div style={{ background: "var(--ink)", padding: "12px var(--gutter)" }}><Link href="/discover" aria-label="Skilion"><Image src="/brand/skilion-wordmark.png" alt="Skilion" width={640} height={213} style={{ height: 28, width: "auto" }} /></Link></div>
      <Onboarding me={selfView(user)} />
    </div>
  );
}
