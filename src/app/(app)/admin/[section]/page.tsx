import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import AdminSection from "@/components/admin/AdminSection";
const OK = ["overview", "reports", "users", "verification", "appeals", "content", "system", "audit"];
export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!OK.includes(section)) notFound();
  const u = await requireRole(["admin", "moderator"]);
  if (["system", "audit"].includes(section) && u.role !== "admin") notFound();
  return <AdminSection section={section} role={u.role} />;
}
