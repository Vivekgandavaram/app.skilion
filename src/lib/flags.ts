import { col } from "./db";

export type Flags = { signupsOpen: boolean; aiEnabled: boolean; maintenance: string };
const DEFAULT: Flags = { signupsOpen: true, aiEnabled: true, maintenance: "" };
let cache: { at: number; v: Flags } | null = null;

/** Feature flags edited from the admin console (settings collection, key "flags"). Cached 30 s. */
export async function getFlags(): Promise<Flags> {
  if (cache && Date.now() - cache.at < 30_000) return cache.v;
  try {
    const d = await (await col("settings")).findOne({ _id: "flags" });
    const v = { ...DEFAULT, ...((d?.value as Partial<Flags>) || {}) };
    cache = { at: Date.now(), v };
    return v;
  } catch { return DEFAULT; }
}
export const clearFlagsCache = () => { cache = null; };
