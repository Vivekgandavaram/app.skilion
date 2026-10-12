import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PageHead } from "@/components/ui";
export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };
const ALL = [["overview", "Overview"], ["reports", "Reports"], ["users", "Members"], ["verification", "Verification"], ["appeals", "Appeals"], ["content", "Content"], ["system", "System"], ["audit", "Audit log"]] as const;
export default async function Layout({ children }: { children: React.ReactNode }) {
  const u = await requireRole(["admin", "moderator"]);
  const tabs = ALL.filter(([s]) => u.role === "admin" || !["system", "audit"].includes(s));
  return (<><PageHead title="Admin console" sub={u.role === "admin" ? "Administrator" : "Moderator"} /><nav className="tabs" aria-label="Admin" style={{ marginBottom: 24 }}>{tabs.map(([s, l]) => <Link key={s} className="tab" href={`/admin/${s}`}>{l}</Link>)}</nav>{children}</>);
}
