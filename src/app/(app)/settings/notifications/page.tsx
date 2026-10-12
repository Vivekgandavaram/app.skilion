import { requireUser } from "@/lib/auth";
import { selfView } from "@/lib/serialize";
import { NotificationsForm } from "@/components/settings/Forms";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Notification settings", noindex: true });
export default async function Page() { return <NotificationsForm user={selfView(await requireUser("/settings/notifications"))} />; }
