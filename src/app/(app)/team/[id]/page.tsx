import { requireUser } from "@/lib/auth";
import { PageHead } from "@/components/ui";
import CartView from "@/components/team/CartView";
import { pageMeta } from "@/lib/seo";
export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Squad Cart", path: "/team", noindex: true });
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/team/${id}`);
  return (<><PageHead title="Squad Cart" sub="Compare people, check coverage and timing, then invite. Nothing is sent until you choose." /><CartView id={id} /></>);
}
