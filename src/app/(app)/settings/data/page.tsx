import { requireUser } from "@/lib/auth";
import { selfView } from "@/lib/serialize";
import { DataForm } from "@/components/settings/Forms";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Your data", noindex: true });
export default async function Page() { return <DataForm user={selfView(await requireUser("/settings/data"))} />; }
