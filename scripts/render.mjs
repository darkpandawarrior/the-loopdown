#!/usr/bin/env node
// Render a lesson's social card (assets/card.yaml) to PNG via Chromium.
//
//   node scripts/render.mjs lessons/<lesson-dir>
//
// Writes <lesson-dir>/assets/card.png at 1200x630.
//
// Why 1200x630 and not the old square: dev.to serves covers through
// `width=1000,height=420,fit=cover`, and Medium/Hashnode/LinkedIn link previews
// are all ~1.91:1 too. A square card lost its top and bottom to that crop, which
// is exactly where the title and the takeaway lived.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { portrait, esc } from "./design-kit.mjs";

const lessonDir = process.argv[2];
if (!lessonDir) { console.error("usage: node scripts/render.mjs lessons/<lesson-dir>"); process.exit(1); }
const cardPath = resolve(lessonDir, "assets/card.yaml");
if (!existsSync(cardPath)) { console.error(`no card data at ${cardPath}`); process.exit(1); }

// Minimal YAML reader: `key: value` and `key:` + `  - item` lists. No deps.
// Trims the indent BEFORE stripping quotes so whitespace inside the quotes
// survives — code lines rely on that indentation to read as code.
const unquote = (s) => s.trim().replace(/^["']|["']$/g, "");
function parseCard(text) {
  const out = {}; let curKey = null;
  for (const raw of text.split("\n")) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    const item = raw.match(/^\s*-\s+(.*)$/);
    if (item && curKey) { (out[curKey] ||= []).push(unquote(item[1])); continue; }
    const kv = raw.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (kv) { curKey = kv[1]; out[curKey] = kv[2] === "" ? [] : unquote(kv[2]); }
  }
  return out;
}

const card = parseCard(readFileSync(cardPath, "utf8"));
const accent = card.accent || "#7c5cff";
const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const W = 1200, H = 630;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
:root { --accent:${accent}; --ink:#F4F8FC; --dim:#A9B9CB; --faint:#5E6A7A;
        --sans:-apple-system,'SF Pro Display','Helvetica Neue',Inter,sans-serif;
        --mono:'SF Mono','JetBrains Mono',Menlo,monospace; }
*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;font-family:var(--sans);color:var(--ink);-webkit-font-smoothing:antialiased}
.card{position:relative;width:${W}px;height:${H}px;overflow:hidden;padding:56px 64px 116px;display:flex;
  background:radial-gradient(110% 120% at 10% 0%, color-mix(in srgb,var(--accent) 26%,transparent) 0%, transparent 58%),
             linear-gradient(150deg,#141B25 0%,#0D1219 52%,#06080B 100%);}
.card::before{content:'';position:absolute;inset:0;pointer-events:none;background:
  linear-gradient(to right,rgba(255,255,255,.045) 1px,transparent 1px) 0 0/40px 40px,
  linear-gradient(to bottom,rgba(255,255,255,.045) 1px,transparent 1px) 0 0/40px 40px,
  radial-gradient(80% 70% at 50% 45%,transparent 55%,rgba(0,0,0,.6) 100%);}
.card::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:.055;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>");}
.rail{position:absolute;left:0;top:0;width:8px;height:100%;
  background:linear-gradient(to bottom,var(--accent),color-mix(in srgb,var(--accent) 40%,transparent) 50%,transparent);}
.col{position:relative;z-index:2;display:flex;flex-direction:column;flex:1;max-width:${card.cast ? "700px" : "100%"}}
.kicker{font-family:var(--mono);font-size:21px;letter-spacing:.26em;color:var(--accent);text-transform:uppercase}
.kicker::before{content:'// ';opacity:.65}
h1{font-size:62px;line-height:1.06;letter-spacing:-.035em;font-weight:800;margin-top:26px;text-wrap:balance}
h1 .hi{color:var(--accent);text-shadow:0 0 56px color-mix(in srgb,var(--accent) 45%,transparent)}
.spacer{flex:1}
.rule{width:72px;height:4px;border-radius:2px;background:var(--accent);margin:0 0 20px}
.take{font-size:33px;font-weight:700;line-height:1.34}
.take .a{color:var(--accent)}
.art{position:absolute;right:-6px;bottom:34px;width:412px;z-index:1;opacity:.9}
.art svg{width:100%;height:auto}
footer{position:absolute;left:64px;right:64px;bottom:30px;z-index:3;display:flex;align-items:center;
  border-top:1px solid rgba(255,255,255,.09);padding-top:20px}
.brand{display:flex;align-items:center;gap:12px;font-family:var(--mono);font-size:22px;font-weight:600}
.mark{width:20px;height:20px;border-radius:50%;border:2.5px solid var(--accent);display:grid;place-items:center}
.mark i{width:7px;height:7px;border-radius:50%;background:var(--accent)}
.handle{margin-left:auto;font-family:var(--mono);font-size:20px;color:var(--faint)}
</style></head><body>
<div class="card">
  <div class="rail"></div>
  ${card.cast ? `<div class="art">${portrait(card.cast, accent)}</div>` : ""}
  <div class="col">
    <div class="kicker">${esc(card.pillar || "")}</div>
    <h1>${arr(card.title).map((l, i, a) => i === a.length - 1 && a.length > 1 ? `<span class="hi">${esc(l)}</span>` : esc(l)).join("<br>")}</h1>
    <div class="spacer"></div>
    <div class="rule"></div>
    <div class="take">${arr(card.takeaway).map((l, i) => i ? `<span class="a">${esc(l)}</span>` : esc(l)).join("<br>")}</div>
  </div>
  <footer>
    <div class="brand"><div class="mark"><i></i></div>The Loopdown</div>
    <div class="handle">${esc(card.handle || "@darkpandawarrior")}</div>
  </footer>
</div></body></html>`;

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await tab.setContent(html, { waitUntil: "load" });
const pngPath = resolve(lessonDir, "assets/card.png");
writeFileSync(pngPath, await tab.screenshot({ type: "png" }));
await browser.close();
console.log(`rendered: ${pngPath}  (1200x630)`);
