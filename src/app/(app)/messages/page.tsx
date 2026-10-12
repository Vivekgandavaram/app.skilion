import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { PageHead } from "@/components/ui";
import MessagesClient from "@/components/messages/MessagesClient";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Messages", path: "/messages", noindex: true });
export default async function Page() {
  const user = await requireUser("/messages");
  return (<><PageHead title="Messages" sub="Chat with people you are bonded with and with your squads." /><Suspense><MessagesClient meId={user._id.toString()} /></Suspense></>);
}
