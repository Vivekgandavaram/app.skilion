#!/usr/bin/env node
// Scans public/illustrations and writes src/generated/illustrations.json so the site picks up new images.
// Usage: node scripts/sync-assets.mjs [--watch]
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const dir = path.join(root, "public", "illustrations");
const out = path.join(root, "src", "generated", "illustrations.json");
const exts = [".webp", ".avif", ".png", ".jpg", ".jpeg", ".svg"];

function scan() {
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const map = {};
  for (const f of fs.readdirSync(dir)) {
    const ext = path.extname(f).toLowerCase();
    if (!exts.includes(ext)) continue;
    const id = path.basename(f, ext);
    const v = Math.floor(fs.statSync(path.join(dir, f)).mtimeMs / 1000);
    // prefer webp > avif > png > jpg > svg when several exist
    if (!map[id] || exts.indexOf(ext) < exts.indexOf(path.extname(map[id].split("?")[0]))) map[id] = `/illustrations/${f}?v=${v}`;
  }
  const next = JSON.stringify(map, null, 2);
  if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== next) {
    fs.writeFileSync(out, next + "\n");
    console.log(`[assets] ${Object.keys(map).length} illustration(s) registered`);
  }
}
scan();
if (process.argv.includes("--watch")) {
  console.log("[assets] watching public/illustrations ...");
  fs.watch(dir, { persistent: true }, () => setTimeout(scan, 150));
}
