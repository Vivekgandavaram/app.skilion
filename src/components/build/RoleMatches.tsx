"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import ProfileCard from "@/components/ProfileCard";
import BondButton from "@/components/BondButton";
import AddToTeamButton from "@/components/AddToTeamButton";
import { useToast } from "@/components/client-ui";

/** Explainable candidates for one role. Suggestions only: the founder decides. */
export default function RoleMatches({ role, cartId }: { role: { key: string; title: string; essentialSkills: string[]; optionalSkills: string[]; hoursPerWeek: number }; cartId?: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true);
    try { const j = await api.post("/api/ai/matches", { role: { title: role.title, essentialSkills: role.essentialSkills, optionalSkills: role.optionalSkills, hoursPerWeek: role.hoursPerWeek } }); setItems(j.items); }
    catch (e: any) { toast(e.message, "err"); } finally { setBusy(false); }
  }
  return (
    <div className="stack">
      {items === null ? <button className="btn btn-soft btn-sm" onClick={load} disabled={busy}>{busy ? <span className="spinner" /> : "Find people for this role"}</button> : (
        <>
          {!items.length && <p className="small muted">No one matches yet. Try fewer essential skills, or <a href={`/explore?skills=${encodeURIComponent(role.essentialSkills.join(","))}`}>search Explore</a>.</p>}
          <div className="grid grid-auto">
            {items.map((p) => <ProfileCard key={p.id} person={p} actions={<><AddToTeamButton userId={p.id} name={p.name} />{<BondButton userId={p.id} name={p.name} />}</>} />)}
          </div>
          {items.length > 0 && <p className="xs muted">Scores use skills, project evidence, availability, overlapping hours and verification. They never use age, gender, ethnicity or similar traits. Suggestions only.</p>}
        </>
      )}
    </div>
  );
}
