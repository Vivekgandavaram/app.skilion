"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { api, ApiError } from "@/lib/client";
import { useToast } from "./client-ui";

export default function MessageButton({ userId }: { userId: string }) {
  const r = useRouter(); const { toast } = useToast(); const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try { const j = await api.post("/api/conversations", { userId }); r.push(`/messages?c=${j.id}`); }
    catch (e: any) { if (e instanceof ApiError && e.code === "needs_bond") toast("Send a bond request first. Messaging opens after they accept.", "info"); else toast(e.message, "err"); setBusy(false); }
  }
  return <button className="btn btn-ghost btn-sm" onClick={go} disabled={busy}><MessageSquare aria-hidden />Message</button>;
}
