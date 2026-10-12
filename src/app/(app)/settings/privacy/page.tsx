import { requireUser } from "@/lib/auth";
import { selfView } from "@/lib/serialize";
import { PrivacyForm } from "@/components/settings/Forms";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Privacy settings", noindex: true });
export default async function Page() { return <PrivacyForm user={selfView(await requireUser("/settings/privacy"))} />; }
