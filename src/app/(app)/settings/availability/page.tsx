import { requireUser } from "@/lib/auth";
import { selfView } from "@/lib/serialize";
import { AvailabilityForm } from "@/components/settings/Forms";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Availability settings", noindex: true });
export default async function Page() { return <AvailabilityForm user={selfView(await requireUser("/settings/availability"))} />; }
