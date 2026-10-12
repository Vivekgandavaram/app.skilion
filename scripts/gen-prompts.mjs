#!/usr/bin/env node
// Generates docs/ILLUSTRATION_PROMPTS.md and docs/illustrations.json from src/data/illustrations.ts
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const src = fs.readFileSync(path.join(process.cwd(), "src/data/illustrations.ts"), "utf8");
// tiny TS->JS strip to avoid a build step: evaluate only the data section
const js = src.replace(/export type Slot[\s\S]*?\n};\n/, "").replace(/const S = \(.*\n/, "const S = (id,title,w,h,where,alt,clear,scene)=>({id,title,w,h,where,alt,clear,scene});\n")
  .replace(/export const SLOT_MAP[\s\S]*?\n\n/, "").replace(/export const /g, "const ").replace(/\(s: Slot\)/g, "(s)").replace(/: Slot\[\]/g, "").replace(/\) as Record<string, Slot>;/, ");")
  .replace(/^\/\*\*[\s\S]*?\*\/\n/, "").replace(/: Record<string, "clear" \| "filled" \| "navy">/g, "").replace(/\n} as const;/g, "\n};").replace(/Slot\["clear"\]/g, "any").replace(/ as Record<string, Slot>/g, "");
const mod = new Function(js.replace(/const SLOT_MAP.*\n/, "") + "\nreturn { SLOTS, BRAND_TEMPLATE };")();
const lines = ["# Skilion illustration prompts", "", "Generate each image with your AI tool, export at the stated size (or the same aspect ratio), and save it as `public/illustrations/<id>.webp`.", "The site swaps the placeholder automatically after `npm run assets:sync` (dev and build run it for you).", ""];
for (const s of mod.SLOTS) {
  lines.push(`## ${s.id}`, `- **Where:** ${s.where}`, `- **Size:** ${s.w} x ${s.h}`, `- **File:** \`public/illustrations/${s.id}.webp\``, `- **Alt text:** ${s.alt || "(decorative)"}`, "", "```", mod.BRAND_TEMPLATE(s), "```", "");
}
fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync("docs/ILLUSTRATION_PROMPTS.md", lines.join("\n"));
fs.writeFileSync("docs/illustrations.json", JSON.stringify(mod.SLOTS.map((s) => ({ ...s, prompt: mod.BRAND_TEMPLATE(s), file: `public/illustrations/${s.id}.webp` })), null, 2));
console.log(`wrote docs/ILLUSTRATION_PROMPTS.md (${mod.SLOTS.length} slots)`);
