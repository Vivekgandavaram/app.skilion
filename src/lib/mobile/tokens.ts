import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

const ACCESS_TTL_SEC = 15 * 60;
const REFRESH_TTL_SEC = 60 * 60 * 24 * 60;

const key = () => new TextEncoder().encode(env.authSecret);

export async function signAccessToken(uid: string, ver = 0, did?: string) {
  const jwt = new SignJWT({ uid, ver, did, typ: "access" });
  jwt.setProtectedHeader({ alg: "HS256" });
  jwt.setIssuedAt();
  jwt.setExpirationTime(`${ACCESS_TTL_SEC}s`);
  return jwt.sign(key());
}

export async function verifyAccessToken(token: string): Promise<{ uid: string; ver: number; did?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (payload.typ && payload.typ !== "access") return null;
    if (typeof payload.uid !== "string") return null;
    return { uid: payload.uid, ver: typeof payload.ver === "number" ? payload.ver : 0, did: typeof payload.did === "string" ? payload.did : undefined };
  } catch {
    return null;
  }
}

export function issueRefreshToken() {
  const raw = crypto.randomBytes(48).toString("base64url");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000);
  return { raw, hash, expiresAt };
}

export function hashRefreshToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function generateDeviceId() {
  return crypto.randomBytes(16).toString("hex");
}
