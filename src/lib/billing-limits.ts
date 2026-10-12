import { col } from "./db";
import { HttpError } from "./api";
import { effectivePlan, PLANS } from "./plans";
import type { UserDoc } from "./types";

type Counted = "carts" | "blueprints" | "savedSearches";
const NAME: Record<Counted, string> = { carts: "Squad Cart drafts", blueprints: "saved blueprints", savedSearches: "saved searches" };

/** Throws 402 with code "upgrade" when the person is at their plan's limit. Existing data is never deleted when a plan lapses. */
export async function assertWithinLimit(user: UserDoc, what: Counted) {
  const limit = effectivePlan(user).limits[what];
  const c = await col(what === "carts" ? "carts" : what === "blueprints" ? "blueprints" : "savedSearches");
  const n = await c.countDocuments(what === "savedSearches" ? { userId: user._id } : { ownerId: user._id });
  if (n >= limit) {
    const next = (["builder_pro", "founder_pro"] as const).find((p) => PLANS[p].limits[what] > limit);
    throw new HttpError(402, `Your plan includes ${limit} ${NAME[what]}.${next ? ` ${PLANS[next].name} raises this to ${PLANS[next].limits[what]}.` : ""}`, "upgrade");
  }
}
