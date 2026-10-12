import { env } from "./env";

type Mail = { to: string; subject: string; html: string; text?: string };

const shell = (title: string, inner: string) => `<!doctype html><html><body style="margin:0;background:#F3FAFE;font-family:Inter,Arial,sans-serif;color:#080B10">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<div style="background:#080B10;border-radius:20px 20px 0 0;padding:20px 24px"><span style="color:#fff;font-weight:800;font-size:20px;letter-spacing:-.02em">Skilion</span><span style="color:#65C7F3;font-size:12px;margin-left:10px">People × Skills × Proof of Work</span></div>
<div style="background:#fff;border-radius:0 0 20px 20px;padding:28px 24px;border:1px solid #DFF5FF">
<h1 style="font-size:20px;margin:0 0 12px">${title}</h1>${inner}
<p style="color:#526174;font-size:12px;margin:28px 0 0">Skilion by VIGO Tech. If you did not expect this email you can ignore it.</p></div></div></body></html>`;

export async function sendEmail(m: Mail): Promise<{ sent: boolean; dev?: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (env.isProd) console.error("RESEND_API_KEY missing: email not sent to", m.to);
    else console.log(`\n[email:dev] to=${m.to} subject=${m.subject}\n${m.text || m.html.replace(/<[^>]+>/g, " ")}\n`);
    return { sent: false, dev: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.RESEND_FROM || "Skilion <onboarding@resend.dev>", to: [m.to], subject: m.subject, html: m.html, text: m.text }),
  });
  if (!res.ok) {
    console.error("Resend error", res.status, await res.text().catch(() => ""));
    throw new Error("We could not send the email. Please try again in a minute.");
  }
  return { sent: true };
}

export const otpEmail = (to: string, code: string, purpose: "verify" | "reset" | "mfa") => {
  const title = purpose === "verify" ? "Verify your email" : purpose === "mfa" ? "Confirm it is you" : "Reset your password";
  const lead = purpose === "verify" ? "Use this code to finish creating your Skilion account." : purpose === "mfa" ? "Use this code to finish signing in." : "Use this code to choose a new password.";
  return sendEmail({
    to,
    subject: `${code} is your Skilion ${purpose === "verify" ? "verification" : purpose === "mfa" ? "sign-in" : "password reset"} code`,
    text: `${lead}\n\nCode: ${code}\n\nIt expires in 10 minutes.`,
    html: shell(title, `<p style="color:#526174;line-height:1.55">${lead}</p>
<div style="font-size:34px;letter-spacing:10px;font-weight:800;background:#F3FAFE;border:1px solid #DFF5FF;border-radius:14px;text-align:center;padding:16px 0;margin:18px 0">${code}</div>
<p style="color:#526174;font-size:13px">This code expires in 10 minutes. Never share it with anyone.</p>`),
  });
};

export const notifyEmail = (to: string, title: string, body: string, href?: string) =>
  sendEmail({
    to,
    subject: title,
    text: `${body}\n${href ? env.siteUrl + href : ""}`,
    html: shell(title, `<p style="color:#526174;line-height:1.55">${body}</p>${href ? `<p><a href="${env.siteUrl}${href}" style="display:inline-block;background:#F0441E;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px">Open in Skilion</a></p>` : ""}`),
  }).catch(() => ({ sent: false }));
