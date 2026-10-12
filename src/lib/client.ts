"use client";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}
async function call<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, { method, headers: body !== undefined ? { "Content-Type": "application/json" } : undefined, body: body !== undefined ? JSON.stringify(body) : undefined, credentials: "same-origin" });
  let data: any = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && !location.pathname.startsWith("/login")) location.href = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;
    throw new ApiError(res.status, data?.error || "Something went wrong. Please try again.", data?.code);
  }
  return data as T;
}
export const api = {
  get: <T = any>(url: string) => call<T>("GET", url),
  post: <T = any>(url: string, body?: unknown) => call<T>("POST", url, body ?? {}),
  put: <T = any>(url: string, body?: unknown) => call<T>("PUT", url, body ?? {}),
  patch: <T = any>(url: string, body?: unknown) => call<T>("PATCH", url, body ?? {}),
  del: <T = any>(url: string, body?: unknown) => call<T>("DELETE", url, body),
};
export const fetcher = (url: string) => api.get(url);

export function timeAgo(iso: string | Date) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
