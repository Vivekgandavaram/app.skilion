import { requireUser } from "@/lib/auth";
import { selfView } from "@/lib/serialize";
import { ProfileForm } from "@/components/settings/Forms";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Profile settings", noindex: true });
export default async function Page() { return <ProfileForm user={selfView(await requireUser("/settings/profile"))} />; }
