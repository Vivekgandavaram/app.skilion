import { requireUser } from "@/lib/auth";
import Workspace from "@/components/projects/Workspace";
import { pageMeta } from "@/lib/seo";
export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Project workspace", noindex: true });
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; await requireUser(`/projects/${id}`); return <Workspace id={id} />; }
