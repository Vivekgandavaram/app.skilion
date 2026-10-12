import { route, notFound, HttpError } from "@/lib/api";
import { col, oid } from "@/lib/db";

export const POST = route<{ id: string }>({ auth: true, rate: { key: "verify-repo", limit: 20, windowSec: 3600 } }, async ({ user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  const works = await col("works");
  const w = await works.findOne({ _id: id, userId: user._id });
  if (!w) throw notFound();
  const login = user.providers.githubLogin;
  if (!login) throw new HttpError(400, "Sign in with GitHub once so we can compare the repository owner with your account. Settings, Security, Connected accounts.");
  let owner = "", repo = "";
  try {
    const u = new URL(w.links.repo || "");
    if (u.hostname !== "github.com") throw 0;
    [owner, repo] = u.pathname.split("/").filter(Boolean);
    repo = (repo || "").replace(/\.git$/, "");
    if (!owner || !repo) throw 0;
  } catch { throw new HttpError(400, "Add a github.com repository link to this project first."); }
  const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, { headers: { Accept: "application/vnd.github+json", "User-Agent": "skilion" }, signal: AbortSignal.timeout(8000) });
  if (res.status === 404) throw new HttpError(400, "We could not find that public repository.");
  if (!res.ok) throw new HttpError(502, "GitHub did not answer. Try again in a minute.");
  const j = (await res.json()) as { owner?: { login?: string } };
  if ((j.owner?.login || "").toLowerCase() !== login.toLowerCase()) throw new HttpError(400, `The repository belongs to ${j.owner?.login}, not to your linked GitHub account (${login}). Organisation repositories are not verified automatically.`);
  await works.updateOne({ _id: id }, { $set: { repoVerified: true } });
  const users = await col("users");
  const vs = user.verifications.filter((v) => !(v.type === "repo" && v.detail === w.links.repo));
  await users.updateOne({ _id: user._id }, { $set: { verifications: [...vs, { type: "repo", at: new Date(), detail: w.links.repo }] } });
  return { ok: true };
});
