import { getSessionUser } from "@/lib/auth";
import { PageHead } from "@/components/ui";
import DiscoverClient from "@/components/feed/DiscoverClient";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Discover: what builders are working on", description: "See what people are building and who they need. Open requests list the goal, the rewards and the skills required.", path: "/discover" });

export default async function Page({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const sp = await searchParams;
  const user = await getSessionUser().catch(() => null);
  return (
    <>
      <PageHead title="Discover" sub="See what people are building and who they need. Requests say the goal, the rewards and the skills." />
      <div style={{ maxWidth: 760 }}>
        <DiscoverClient signedIn={!!user} emailVerified={!!user?.emailVerified} initialTag={sp.tag?.slice(0, 40)} />
      </div>
    </>
  );
}
