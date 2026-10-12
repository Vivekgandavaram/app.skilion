import { requireUser } from "@/lib/auth";
import { PageHead } from "@/components/ui";
import TeamClient from "@/components/team/TeamClient";
import { pageMeta } from "@/lib/seo";
export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "My Team", path: "/team", noindex: true });
export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireUser("/team");
  const sp = await searchParams;
  return (<><PageHead title="My Team" sub="Squad Carts you are assembling, and invitations to join other people's projects." /><TeamClient initialTab={sp.tab === "invitations" ? "invitations" : "carts"} /></>);
}
