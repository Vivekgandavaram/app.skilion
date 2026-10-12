import { notFound } from "next/navigation";
import { col } from "@/lib/db";
import { cartDetail } from "@/lib/cart-view";
import { pageMeta } from "@/lib/seo";
import { Avatar, SkillChip } from "@/components/ui";
import { GOAL_LABEL, type CartDoc, type UserDoc } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { ...pageMeta({ title: "Squad plan (advisor view)", noindex: true }), referrer: "no-referrer" as const };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{48}$/.test(token)) notFound();
  const cart = (await (await col("carts")).findOne({ advisorToken: token })) as CartDoc | null;
  if (!cart) notFound();
  const owner = (await (await col("users")).findOne({ _id: cart.ownerId })) as UserDoc | null;
  if (!owner) notFound();
  const d = await cartDetail(cart, owner, { advisor: true });
  return (
    <div className="container-narrow stack-lg" style={{ paddingBlock: 48 }}>
      <div className="stack-sm"><span className="eyebrow">Advisor view, read only</span><h1 className="h1">{d.cart.name}</h1>
        <p className="muted">{owner.name} shared this squad plan for feedback. {d.cart.goal ? `Goal: ${GOAL_LABEL[d.cart.goal as keyof typeof GOAL_LABEL]}.` : ""} Contact details and availability are hidden.</p></div>
      {d.cart.roles.map((r: any) => (
        <section key={r.key} className="card card-pad stack"><div className="row between"><b>{r.title}</b><span className="small muted">{r.hoursPerWeek} h/week</span></div>
          <div className="chips">{r.essentialSkills.map((s: string) => <span key={s} className="chip">{s}</span>)}</div>
          {d.items.filter((i: any) => i.roleKey === r.key).map((i: any) => <div key={i.person.id} className="row-nowrap"><Avatar name={i.person.name} image={i.person.image} /><div><b>{i.person.name}</b><div className="small muted">{i.person.headline}</div><div className="chips">{i.person.skills.slice(0, 5).map((s: any) => <SkillChip key={s.slug} name={s.name} evidenced={s.evidenceWorkIds.length > 0} />)}</div></div></div>)}
        </section>
      ))}
      <div className="chips">{d.coverage.essential.map((s: any) => <span key={s.skill} style={{ textTransform: "capitalize" }} className={`chip ${s.covered ? "chip-ok" : "chip-hot"}`}>{s.skill}: {s.covered ? "covered" : "gap"}</span>)}</div>
    </div>
  );
}
