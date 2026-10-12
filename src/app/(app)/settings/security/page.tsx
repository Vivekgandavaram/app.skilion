import { requireUser } from "@/lib/auth";
import { selfView } from "@/lib/serialize";
import { SecurityForm } from "@/components/settings/Forms";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Security settings", noindex: true });
export default async function Page() { return <SecurityForm user={selfView(await requireUser("/settings/security"))} />; }
