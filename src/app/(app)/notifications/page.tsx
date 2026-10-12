import { requireUser } from "@/lib/auth";
import { PageHead } from "@/components/ui";
import NotificationsClient from "@/components/discover/NotificationsClient";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Notifications", path: "/notifications", noindex: true });
export default async function Page() {
  await requireUser("/notifications");
  return (<><PageHead title="Notifications" /><NotificationsClient /></>);
}
