#!/usr/bin/env node
// Generate a self-contained analytics dashboard (dashboard.html) from registry.json
// + metrics.json. dev.to numbers are live (via metrics.mjs); other channels show
// links. Theme-aware, no external deps. Publish it as an artifact or open locally.
//
//   node scripts/metrics.mjs && node scripts/dashboard.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const reg = existsSync(join(ROOT, "data/registry.json")) ? JSON.parse(readFileSync(join(ROOT, "data/registry.json"), "utf8")) : { lessons: [], series: [] };
const metrics = existsSync(join(ROOT, "data/metrics.json")) ? JSON.parse(readFileSync(join(ROOT, "data/metrics.json"), "utf8")) : { latest: { posts: {}, totals: {} }, history: [] };
const posts = metrics.latest?.posts || {};
const lessons = reg.lessons || [];
const live = lessons.filter((l) => l.status === "published");
const T = metrics.latest?.totals || { views: 0, reactions: 0, comments: 0 };
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const tile = (label, val, sub = "") => `<div class="tile"><div class="v">${val}</div><div class="l">${label}</div>${sub ? `<div class="s">${sub}</div>` : ""}</div>`;

const rows = lessons.map((l) => {
  const m = posts[l.slug] || {};
  const st = l.status === "published" ? "🟢 live" : l.status === "ready" ? "🟡 ready" : "⚪ draft";
  return `<tr>
    <td><b>${esc(l.title)}</b><div class="sub">${esc(l.series || "")}</div></td>
    <td>${st}</td>
    <td class="n">${m.views ?? "—"}</td>
    <td class="n">${m.reacts ?? "—"}</td>
    <td class="n">${m.comments ?? "—"}</td>
    <td>${l.live ? `<a href="${esc(l.live)}">dev.to →</a>` : "—"}</td>
  </tr>`;
}).join("\n");

// tiny sparkline from history (views over time)
const hist = (metrics.history || []).slice(-14);
const spark = hist.length > 1 ? (() => {
  const max = Math.max(1, ...hist.map((h) => h.views));
  const pts = hist.map((h, i) => `${(i / (hist.length - 1)) * 100},${30 - (h.views / max) * 28}`).join(" ");
  return `<svg viewBox="0 0 100 30" preserveAspectRatio="none" class="spark"><polyline points="${pts}"/></svg>`;
})() : `<div class="s">metrics history builds as you run <code>metrics.mjs</code> over time</div>`;

const html = `<title>The Loopdown — Analytics</title>
<style>
  :root{--bg:#0d1117;--surface:#161b22;--border:#21262d;--ink:#e6edf3;--muted:#8b949e;--accent:#7c5cff;--good:#3fb950;
    --mono:ui-monospace,"SF Mono",Menlo,monospace;--sans:-apple-system,system-ui,sans-serif}
  @media(prefers-color-scheme:light){:root{--bg:#f5f6f8;--surface:#fff;--border:#dce1e7;--ink:#141922;--muted:#586171;--accent:#6338ff;--good:#1a7f37}}
  :root[data-theme="dark"]{--bg:#0d1117;--surface:#161b22;--border:#21262d;--ink:#e6edf3;--muted:#8b949e;--accent:#7c5cff;--good:#3fb950}
  :root[data-theme="light"]{--bg:#f5f6f8;--surface:#fff;--border:#dce1e7;--ink:#141922;--muted:#586171;--accent:#6338ff;--good:#1a7f37}
  *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);padding:clamp(16px,4vw,40px)}
  .wrap{max-width:900px;margin:0 auto}
  h1{font-family:var(--mono);font-size:24px;margin:0 0 4px;letter-spacing:-.01em}
  .eyebrow{font-family:var(--mono);color:var(--accent);font-size:12px;letter-spacing:.2em;text-transform:uppercase;margin:0}
  .tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:22px 0}
  @media(max-width:640px){.tiles{grid-template-columns:repeat(2,1fr)}}
  .tile{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px}
  .tile .v{font-family:var(--mono);font-size:26px;font-weight:700}
  .tile .l{color:var(--muted);font-size:12px;margin-top:4px}
  .tile .s{color:var(--muted);font-size:11px;margin-top:6px}
  .panel{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px 20px;margin-top:18px}
  .label{font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0 0 12px}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th{text-align:left;font-family:var(--mono);font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;padding:6px 8px;border-bottom:1px solid var(--border)}
  td{padding:10px 8px;border-bottom:1px solid var(--border);vertical-align:top}
  td.n{font-family:var(--mono);text-align:right;font-variant-numeric:tabular-nums}
  .sub{color:var(--muted);font-size:12px;font-family:var(--mono)}
  a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
  .spark{width:100%;height:48px}.spark polyline{fill:none;stroke:var(--accent);stroke-width:1.5;vector-effect:non-scaling-stroke}
  .foot{color:var(--muted);font-family:var(--mono);font-size:11px;margin-top:20px;text-align:center}
  code{font-family:var(--mono);background:var(--border);border-radius:4px;padding:1px 5px}
</style>
<div class="wrap">
  <p class="eyebrow">The Loopdown · Analytics</p>
  <h1>Distribution dashboard</h1>
  <div class="tiles">
    ${tile("Posts", lessons.length)}
    ${tile("Live", live.length, `${reg.series?.length || 0} series`)}
    ${tile("dev.to views", T.views ?? 0)}
    ${tile("Reactions", (T.reactions ?? 0) + " · " + (T.comments ?? 0) + " comments")}
  </div>
  <div class="panel">
    <p class="label">Views over time (dev.to)</p>
    ${spark}
  </div>
  <div class="panel">
    <p class="label">Posts</p>
    <table>
      <thead><tr><th>Post</th><th>Status</th><th class="n">Views</th><th class="n">Reacts</th><th class="n">Comm</th><th>Link</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6">no posts yet</td></tr>'}</tbody>
    </table>
  </div>
  <p class="foot">dev.to numbers are live via metrics.mjs · LinkedIn / Medium / Hashnode are manual in meta.yaml · regenerate with node scripts/dashboard.mjs</p>
</div>`;

writeFileSync(join(ROOT, "dashboard.html"), html);
console.log(`dashboard → dashboard.html  (${lessons.length} posts, ${T.views ?? 0} dev.to views)`);
