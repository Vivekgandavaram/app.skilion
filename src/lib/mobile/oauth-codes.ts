import crypto from "node:crypto";

const codes = new Map<string, { userId: string; exp: number }>();

export function issueMobileCode(userId: string) {
  const code = crypto.randomBytes(32).toString("base64url");
  codes.set(code, { userId, exp: Date.now() + 60000 });
  for (const [k, v] of codes) if (v.exp < Date.now()) codes.delete(k);
  return code;
}

export function consumeMobileCode(code: string): { userId: string } | null {
  const entry = codes.get(code);
  if (!entry || entry.exp < Date.now()) return null;
  codes.delete(code);
  return { userId: entry.userId };
}
