import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PageHead } from "@/components/ui";
import Illustration from "@/components/Illustration";
import BuildClient from "@/components/build/BuildClient";
import { aiRemaining } from "@/lib/plans";
import { pageMeta } from "@/lib/seo";
import { col } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Build an idea", path: "/build", noindex: true });

export default async function Page({ searchParams }: { searchParams: Promise<{ b?: string }> }) {
  const user = await requireUser("/build");
  const sp = await searchParams;
  const a = aiRemaining(user);
  const recent = await (await col("blueprints")).find({ ownerId: user._id }).sort({ createdAt: -1 }).limit(5).toArray().catch(() => []);
  const goalArt = { validate: <Illustration id="goal-validate" rounded={false} />, prototype: <Illustration id="goal-prototype" rounded={false} />, help: <Illustration id="goal-help" rounded={false} />, company: <Illustration id="goal-company" rounded={false} /> };
  return (
    <>
      <PageHead eyebrow="Squad Architect" title="Build an idea" sub="Tell us what you want to do. We draft a small team plan you can edit, then help you find the people." />
      {recent.length > 0 && <div className="row small" style={{ marginBottom: 20 }}><b>Recent plans:</b>{recent.map((b) => <Link key={b._id.toString()} className="chip chip-line" href={`/build?b=${b._id}`}>{b.input.vision.slice(0, 32)}…</Link>)}</div>}
      <BuildClient goalArt={goalArt} initialId={sp.b} aiLeft={{ remaining: a.remaining, limit: a.limit }} />
    </>
  );
}
