import { route, query } from "@/lib/api";
import { col } from "@/lib/db";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const GET = route({ auth: "mod" }, async ({ req }) => {
  const q = (query(req).q || "").trim().slice(0, 80);
  const f: any = q ? { $or: [{ email: { $regex: esc(q), $options: "i" } }, { name: { $regex: esc(q), $options: "i" } }, { handle: { $regex: esc(q), $options: "i" } }] } : {};
  const rows = await (await col("users")).find(f, { projection: { passwordHash: 0, availability: 0, skills: 0, bio: 0 } }).sort({ createdAt: -1 }).limit(50).toArray();
  return { items: rows.map((u) => ({ id: u._id.toString(), name: u.name, handle: u.handle, email: u.email, emailVerified: u.emailVerified, role: u.role, status: u.status, plan: u.plan.id, planExpires: u.plan.expiresAt?.toISOString(), onboarded: u.onboarded, isDemo: !!u.isDemo, createdAt: u.createdAt.toISOString() })) };
});
