import { requireUser } from "@/lib/auth";
import WorksManager from "@/components/settings/WorksManager";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Proof of work", noindex: true });
export default async function Page() { const u = await requireUser("/settings/proof-of-work"); return <WorksManager hasGithub={!!u.providers.githubLogin} emailVerified={u.emailVerified} />; }
