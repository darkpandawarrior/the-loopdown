#!/usr/bin/env node
// Pull live dev.to stats (views / reactions / comments) for published lessons and
// print a dashboard + snapshot to data/metrics.json. dev.to is the only channel with
// a free stats API; LinkedIn/Medium/Hashnode numbers stay manual in meta.yaml.
//
//   node scripts/metrics.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { get, has } from "./lib/config.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
if (!has("DEVTO_API_KEY")) { console.error("no DEVTO_API_KEY — see SETUP.md"); process.exit(1); }

const regPath = join(ROOT, "data", "registry.json");
const lessons = existsSync(regPath) ? (JSON.parse(readFileSync(regPath, "utf8")).lessons || []) : [];
const published = lessons.filter((l) => l.live);

const r = await fetch("https://dev.to/api/articles/me?per_page=100", { headers: { "api-key": get("DEVTO_API_KEY"), Accept: "application/vnd.forem.api-v1+json" } });
if (r.status !== 200) {
  console.error(`dev.to API HTTP ${r.status}` + (r.status === 401 ? " — usually rate limiting; wait ~30s and retry. (Key is fine if check-setup shows dev.to ●.)" : ""));
  process.exit(1);
}
const mine = await r.json();
const byUrl = new Map(mine.map((a) => [a.url, a]));

const pad = (s, n) => String(s).padEnd(n);
const num = (s, n) => String(s).padStart(n);
console.log("\n  The Loopdown — dev.to metrics\n  " + "─".repeat(58));
console.log(`  ${pad("Post", 34)} ${num("views", 7)} ${num("reacts", 7)} ${num("comm", 6)}`);
console.log("  " + "─".repeat(58));

let tv = 0, tr = 0, tc = 0;
const snapshot = {};
for (const l of published) {
  const a = byUrl.get(l.live);
  const views = a?.page_views_count ?? 0, reacts = a?.public_reactions_count ?? 0, comments = a?.comments_count ?? 0;
  tv += views; tr += reacts; tc += comments;
  snapshot[l.slug] = { views, reacts, comments, url: l.live };
  const title = (l.title || l.slug).slice(0, 33);
  console.log(`  ${pad(title, 34)} ${num(views, 7)} ${num(reacts, 7)} ${num(comments, 6)}`);
}
console.log("  " + "─".repeat(58));
console.log(`  ${pad("TOTAL (" + published.length + " posts)", 34)} ${num(tv, 7)} ${num(tr, 7)} ${num(tc, 6)}\n`);

// snapshot (timestamp passed in so the script stays deterministic-friendly)
const stamp = process.env.STAMP || new Date().toISOString().slice(0, 10);
const out = existsSync(join(ROOT, "data", "metrics.json")) ? JSON.parse(readFileSync(join(ROOT, "data", "metrics.json"), "utf8")) : { history: [] };
out.latest = { date: stamp, totals: { views: tv, reactions: tr, comments: tc }, posts: snapshot };
out.history = (out.history || []).filter((h) => h.date !== stamp).concat([{ date: stamp, views: tv, reactions: tr, comments: tc }]).slice(-90);
writeFileSync(join(ROOT, "data", "metrics.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`  snapshot → data/metrics.json (${stamp})\n`);
