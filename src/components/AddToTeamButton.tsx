"use client";
import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Check } from "lucide-react";
import { api } from "@/lib/client";
import { Modal, useToast } from "./client-ui";

type CartLite = { id: string; name: string; roles: { key: string; title: string }[]; members: number };

/** "Add to team": pick a Squad Cart and a role (or none yet). Contract: POST /api/team/add. */
export default function AddToTeamButton({ userId, name, size = "sm" }: { userId: string; name: string; size?: "sm" | "md" }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [carts, setCarts] = useState<CartLite[] | null>(null);
  const [cartId, setCartId] = useState("");
  const [roleKey, setRoleKey] = useState("unassigned");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function openIt() {
    setOpen(true);
    if (!carts) { try { const j = await api.get("/api/carts"); setCarts(j.items); setCartId(j.items[0]?.id || ""); } catch (e: any) { toast(e.message, "err"); setOpen(false); } }
  }
  const cart = carts?.find((c) => c.id === cartId);
  async function add() {
    setBusy(true);
    try { const j = await api.post("/api/team/add", { userId, cartId: cartId || undefined, roleKey }); setDone(j.cartId); toast(j.already ? `${name} is already in that role.` : `${name} added to ${j.name}.`, "ok"); setOpen(false); }
    catch (e: any) { toast(e.message, "err"); } finally { setBusy(false); }
  }
  if (done) return <Link className={`btn btn-soft btn-${size}`} href={`/team/${done}`}><Check aria-hidden />In your team</Link>;
  return (
    <>
      <button className={`btn btn-ghost btn-${size}`} onClick={openIt}><ShoppingBag aria-hidden />Add to team</button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Add ${name} to your team`}>
        <div className="stack">
          {!carts ? <span className="spinner" /> : (
            <>
              <p className="muted small">Your Squad Cart is a shortlist. Nothing is sent to {name.split(" ")[0]} until you invite them.</p>
              {carts.length > 0 ? (
                <>
                  <label className="label" htmlFor="atc-cart">Cart</label>
                  <select id="atc-cart" className="select" value={cartId} onChange={(e) => { setCartId(e.target.value); setRoleKey("unassigned"); }}>
                    {carts.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.members})</option>)}
                  </select>
                  <label className="label" htmlFor="atc-role">Role</label>
                  <select id="atc-role" className="select" value={roleKey} onChange={(e) => setRoleKey(e.target.value)}>
                    <option value="unassigned">No role yet</option>
                    {cart?.roles.map((r) => <option key={r.key} value={r.key}>{r.title}</option>)}
                  </select>
                </>
              ) : <p className="small">You have no cart yet. We will create one called “My squad”.</p>}
              <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={add} disabled={busy}>{busy ? <span className="spinner" /> : "Add"}</button></div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
