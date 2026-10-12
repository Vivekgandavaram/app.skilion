import { requireUser } from "@/lib/auth";
import { PageHead } from "@/components/ui";
import NetworkClient from "@/components/discover/NetworkClient";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Bonds", path: "/network", noindex: true });
export default async function Page() {
  await requireUser("/network");
  return (<><PageHead title="Bonds" sub="People you have bonded with, and requests waiting for you." /><NetworkClient /></>);
}
