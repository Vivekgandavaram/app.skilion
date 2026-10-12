import { route } from "@/lib/api";
import { col } from "@/lib/db";
import { ser } from "@/lib/serialize";
export const GET = route({ auth: "mod" }, async () => ({ items: ser(await (await col("appeals")).find({}).sort({ status: 1, createdAt: -1 }).limit(100).toArray()) }));
