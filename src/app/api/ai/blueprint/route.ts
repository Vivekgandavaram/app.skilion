import { z } from "zod";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";
import { generateBlueprint, PROMPT_VERSION } from "@/lib/gemini";
import { aiRemaining, monthKey } from "@/lib/plans";
import { assertWithinLimit } from "@/lib/billing-limits";
import { getFlags } from "@/lib/flags";
import { InputSchema } from "@/lib/schemas";



/** AI is advisory: it proposes a plan, the founder edits it. Template fallback is not counted against the AI allowance. */
export const POST = route({ auth: true, verified: true, rate: { key: "ai-blueprint", limit: 30, windowSec: 3600 } }, async ({ req, user }) => {
  const input = await body(req, InputSchema);
  const flags = await getFlags();
  await assertWithinLimit(user, "blueprints");
  const quota = aiRemaining(user);
  const useAi = flags.aiEnabled && quota.remaining > 0;
  const r = useAi ? await generateBlueprint(input) : await (async () => { const g = await import("@/lib/gemini"); return { output: g.fallbackBlueprint(input), source: "fallback" as const, model: undefined, note: !flags.aiEnabled ? "AI planning is paused by Skilion right now, so a template plan was used." : `You have used all ${quota.limit} AI runs this month, so a template plan was used. Upgrade for more.` }; })();
  const users = await col("users");
  if (r.source === "gemini") {
    const mk = monthKey();
    if (user.usage?.aiMonth === mk) await users.updateOne({ _id: user._id }, { $inc: { "usage.aiCount": 1 } });
    else await users.updateOne({ _id: user._id }, { $set: { usage: { aiMonth: mk, aiCount: 1 } } });
  }
  const ins = await (await col("blueprints")).insertOne({ ownerId: user._id, input, output: r.output, source: r.source, model: r.model, promptVersion: PROMPT_VERSION, createdAt: new Date() } as any);
  const after = aiRemaining({ ...user, usage: r.source === "gemini" ? { aiMonth: monthKey(), aiCount: quota.used + 1 } : user.usage } as any);
  return { ok: true, id: ins.insertedId.toString(), output: r.output, source: r.source, note: (r as any).note, ai: after };
});
