import { z } from "zod";
import { route, body } from "@/lib/api";
import { col } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email";

const Schema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(160),
  topic: z.string().max(60),
  message: z.string().trim().min(10).max(4000),
  website: z.string().max(200).optional(), // honeypot
});
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

export const POST = route({ rate: { key: "contact", limit: 5, windowSec: 3600 } }, async ({ req }) => {
  const d = await body(req, Schema);
  if (d.website) return { ok: true }; // bots get a silent success
  await (await col("contacts")).insertOne({ name: d.name, email: d.email, topic: d.topic, message: d.message, createdAt: new Date() } as any);
  if (d.topic === "Appeal a decision") await (await col("appeals")).insertOne({ email: d.email, message: d.message, status: "open", createdAt: new Date() } as any);
  await sendEmail({ to: env.contactEmail, subject: `[Skilion contact] ${d.topic} from ${d.name}`, text: `${d.name} <${d.email}>\n\n${d.message}`, html: `<p><b>${esc(d.name)}</b> &lt;${esc(d.email)}&gt;</p><p><b>${esc(d.topic)}</b></p><p style="white-space:pre-wrap">${esc(d.message)}</p>` }).catch(() => null);
  return { ok: true };
});
