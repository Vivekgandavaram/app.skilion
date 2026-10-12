import { getSessionUser } from "@/lib/auth";
import { PageHead } from "@/components/ui";
import ExploreClient from "@/components/discover/ExploreClient";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Explore builders by what they have built", description: "Search people by skills, project evidence, availability and what they will work for. Find collaborators for an idea, a prototype or a company.", path: "/explore" });

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const user = await getSessionUser().catch(() => null);
  const pick = ["q", "skills", "skill", "domain", "sub", "goal", "comp"] as const;
  const initial: Record<string, string> = {};
  for (const k of pick) if (sp[k]) initial[k === "skill" ? "skills" : k] = String(sp[k]).slice(0, 120);
  return (<><PageHead title="Explore" sub="Find people by what they have built, how much time they have and what they will work for." /><ExploreClient signedIn={!!user} initial={initial} /></>);
}
