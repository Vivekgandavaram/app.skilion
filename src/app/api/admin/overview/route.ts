import { route } from "@/lib/api";
import { col } from "@/lib/db";

export const GET = route({ auth: "mod" }, async () => {
  const week = new Date(Date.now() - 7 * 86400_000);
  const c = async (n: any, f: any = {}) => (await col(n)).countDocuments(f);
  const [users, newUsers, onboarded, posts, projects, openReports, urgent, pendingVer, appeals, paid, revenue] = await Promise.all([
    c("users", { isDemo: { $ne: true } }), c("users", { createdAt: { $gt: week }, isDemo: { $ne: true } }), c("users", { onboarded: true, isDemo: { $ne: true } }), c("posts", { deleted: { $ne: true }, isDemo: { $ne: true } }), c("projects"),
    c("reports", { status: "open" }), c("reports", { status: "open", severity: { $in: ["high", "urgent"] } }), c("verificationRequests", { status: "pending" }), c("appeals", { status: "open" }), c("payments", { status: "paid" }),
    (await col("payments")).aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, t: { $sum: "$amount" } } }]).toArray(),
  ]);
  return { users, newUsers, onboarded, posts, projects, openReports, urgent, pendingVer, appeals, paid, revenue: revenue[0]?.t || 0 };
});
