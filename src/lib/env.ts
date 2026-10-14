export const env = {
  get siteUrl() {
    return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  },
  get authSecret() {
    const s = process.env.AUTH_SECRET;
    if (!s || s.length < 16) {
      if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set (16+ chars)");
      return "dev-only-secret-change-me-please-1234567890";
    }
    return s;
  },
  get isProd() {
    return process.env.NODE_ENV === "production";
  },
  get adminEmails() {
    return (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  },
  get gst() {
    const n = Number(process.env.GST_PERCENT ?? 18);
    return Number.isFinite(n) ? n : 18;
  },
  get contactEmail() {
    return process.env.CONTACT_EMAIL || "info@vigotech.in";
  },
};
export const has = (k: string) => !!process.env[k];
