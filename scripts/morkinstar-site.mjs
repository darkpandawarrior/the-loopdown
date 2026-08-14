#!/usr/bin/env node
// The Morkinstar Journals — the reader.
//
//   node scripts/morkinstar-plates.mjs      # first: renders assets/ + assets/web/
//   node scripts/morkinstar-site.mjs        # then: builds fiction/morkinstar-journals/site.html
//
// One self-contained HTML file. Every plate is inlined as a data URI and every story is
// inlined as parsed markup, because the publish target has a strict CSP that blocks any
// external request. No build step, no framework, no dependency.
//
// Season 1 is the Directory's dark survey form. Season 2 is his own paper page. The site
// carries that split all the way through: switching season repaints the whole shell.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIC = join(ROOT, "fiction/morkinstar-journals");
const WEB = join(FIC, "assets/web");

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ── frontmatter + a small markdown renderer ─────────────────────────────────
function parse(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { fm: {}, body: md };
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
  }
  return { fm, body: m[2] };
}

// Inline spans. Order matters: escape first, then decorate, so markup can't be injected.
const inline = (s) => esc(s)
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
  .replace(/`([^`]+)`/g, "<code>$1</code>");

function mdToHtml(body) {
  const out = [];
  const lines = body.split("\n");
  let i = 0, para = [];
  const flush = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };

  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { flush(); i++; continue; }
    if (/^#\s/.test(l)) { flush(); out.push(`<h1>${inline(l.slice(2))}</h1>`); i++; continue; }
    if (/^##\s/.test(l)) { flush(); out.push(`<h2>${inline(l.slice(3))}</h2>`); i++; continue; }
    if (/^---+$/.test(l.trim())) { flush(); out.push("<hr>"); i++; continue; }
    if (/^>\s?/.test(l)) {
      flush();
      const b = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { b.push(lines[i].replace(/^>\s?/, "")); i++; }
      out.push(`<blockquote>${inline(b.join(" "))}</blockquote>`);
      continue;
    }
    if (/^\s*\|/.test(l)) {
      flush();
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i].trim()); i++; }
      const cells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(rows[0]);
      const bodyRows = rows.slice(rows[1] && /^[\s|:-]+$/.test(rows[1]) ? 2 : 1);
      out.push(`<div class="tw"><table><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>` +
        bodyRows.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("") +
        `</tbody></table></div>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(l)) {
      flush();
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, "")); i++; }
      out.push(`<ul>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</ul>`);
      continue;
    }
    if (/^\[(Fun|Page)/.test(l.trim())) {
      flush();
      out.push(`<div class="aside">${inline(l.trim().replace(/^\[|\]$/g, ""))}</div>`);
      i++; continue;
    }
    para.push(l.trim()); i++;
  }
  flush();
  return out.join("\n");
}

const dataURI = (file) => {
  const p = join(WEB, file);
  if (!existsSync(p)) return "";
  return `data:image/jpeg;base64,${readFileSync(p).toString("base64")}`;
};

// ── gather ──────────────────────────────────────────────────────────────────
const S1_FILES = [
  ["s1-01-legend-of-koaeluae-scales", join(ROOT, "archive/legend-of-koaeluae-scales.md")],
  ...readdirSync(FIC).filter((f) => /^\d\d-.*\.md$/.test(f)).sort()
    .map((f) => [null, join(FIC, f)]),
];
const S2_FILES = readdirSync(FIC).filter((f) => /^s2-\d\d-.*\.md$/.test(f)).sort()
  .map((f) => [f.replace(/\.md$/, ""), join(FIC, f)]);

const webFiles = existsSync(WEB) ? readdirSync(WEB) : [];
const findPlate = (season, idx, slug) => {
  const pref = `${season}-${String(idx).padStart(2, "0")}-`;
  return webFiles.find((f) => f.startsWith(pref)) || webFiles.find((f) => f.includes(slug)) || "";
};

function collect(files, season) {
  return files.map(([, path], n) => {
    if (!existsSync(path)) return null;
    const { fm, body } = parse(readFileSync(path, "utf8"));
    const idx = n + 1;
    return {
      season, idx,
      title: fm.title || "(untitled)",
      slug: fm.slug || `s${season}-${idx}`,
      where: fm.planet || "",
      system: fm.system || "",
      page: fm.page || "",
      entry: fm.entry || "",
      phenom: fm.phenomenon || "",
      blurb: fm.blurb || "",
      words: fm.words || "",
      plate: dataURI(findPlate(`s${season}`, idx, fm.slug || "")),
      html: mdToHtml(body),
    };
  }).filter(Boolean);
}

const s1 = collect(S1_FILES, 1);
const s2 = collect(S2_FILES, 2);
const all = [...s1, ...s2];
console.log(`  season 1: ${s1.length} entries · season 2: ${s2.length} pages`);

// ── the starmap ─────────────────────────────────────────────────────────────
// Every world he has filed, placed in space, with a time axis. Dragging the axis
// runs the Concluded count from 611 to 671 and the sky goes out behind him.
// Canvas 2D with a hand-rolled perspective projection: seven hundred points and
// some lines do not need WebGL, and the publish target blocks external libraries.
const STARMAP = JSON.parse(readFileSync(join(FIC, "starmap.json"), "utf8"));

const card = (e) => `<article class="card" data-open="${e.season}-${e.idx}">
  ${e.plate ? `<div class="thumb"><img loading="lazy" src="${e.plate}" alt=""></div>` : `<div class="thumb ph"></div>`}
  <div class="meta">
    <div class="kick">${e.season === 1 ? `ENTRY #${esc(e.entry)}` : `PAGE ${esc(e.page)} OF 91`}</div>
    <h3>${esc(e.title)}</h3>
    <div class="where">${esc(e.where)}${e.system && e.system !== "[none]" ? ` · ${esc(e.system)}` : ""}</div>
    <p>${esc(e.blurb)}</p>
  </div></article>`;

const reader = (e) => `<section class="read" id="r-${e.season}-${e.idx}" hidden>
  <button class="back" data-back>← all ${e.season === 1 ? "entries" : "pages"}</button>
  ${e.plate ? `<img class="hero" src="${e.plate}" alt="">` : ""}
  <div class="prose">${e.html}</div>
  <div class="navrow">
    ${e.idx > 1 ? `<button data-open="${e.season}-${e.idx - 1}">← previous</button>` : "<span></span>"}
    ${e.idx < (e.season === 1 ? s1.length : s2.length) ? `<button data-open="${e.season}-${e.idx + 1}">next →</button>` : "<span></span>"}
  </div></section>`;

const html = `<title>The Morkinstar Journals</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{
  --bg:#06080B; --bg2:#0D1219; --panel:#101822; --line:#1E2733;
  --ink:#F2F6FA; --dim:#A6B6C8; --faint:#5C6878; --accent:#8FD3FF; --amber:#D9A441;
  --mono:"SF Mono",ui-monospace,Menlo,monospace; --sans:-apple-system,system-ui,"Inter",sans-serif;
}
body.s2{ --bg:#DED1B4; --bg2:#E9DFC9; --panel:#F2EAD8; --line:#C3B492;
  --ink:#1F1A12; --dim:#5E5340; --faint:#8E8368; --accent:#8A5A28; --amber:#7A3E2E; }
*{box-sizing:border-box;margin:0;padding:0}
/* an explicit display: wins over the hidden attribute, so make hidden win back */
[hidden]{display:none!important}
body{background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.6;
  transition:background .35s,color .35s}
.wrap{max-width:1120px;margin:0 auto;padding:clamp(20px,4vw,56px)}
header.top{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;margin-bottom:8px}
.brand{font-family:var(--mono);font-size:13px;letter-spacing:.28em;color:var(--amber);text-transform:uppercase}
h1.title{font-size:clamp(34px,6vw,62px);line-height:1;letter-spacing:-.03em;margin:14px 0 10px}
.tag{color:var(--dim);font-size:clamp(15px,2vw,19px);max-width:60ch}
.seasons{display:flex;gap:10px;margin:30px 0 8px;flex-wrap:wrap}
.seasons button{font-family:var(--mono);font-size:13px;letter-spacing:.16em;text-transform:uppercase;
  padding:11px 18px;border-radius:999px;border:1px solid var(--line);background:transparent;
  color:var(--dim);cursor:pointer;transition:.2s}
.seasons button[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:var(--bg);font-weight:600}
.seasons button:hover{border-color:var(--accent);color:var(--ink)}
.note{font-family:var(--mono);font-size:12px;color:var(--faint);margin-bottom:26px;letter-spacing:.06em}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden;
  cursor:pointer;transition:.2s;display:flex;flex-direction:column}
.card:hover{transform:translateY(-3px);border-color:var(--accent)}
.thumb{aspect-ratio:1200/1560;overflow:hidden;background:var(--bg2)}
.thumb img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
.thumb.ph{display:grid;place-items:center}
.meta{padding:16px 18px 20px}
.kick{font-family:var(--mono);font-size:11px;letter-spacing:.18em;color:var(--amber)}
.meta h3{font-size:20px;line-height:1.2;margin:8px 0 6px;letter-spacing:-.01em}
.where{font-family:var(--mono);font-size:12px;color:var(--faint);margin-bottom:10px}
.meta p{font-size:14px;color:var(--dim);line-height:1.5}
.read{max-width:74ch;margin:0 auto}
.back,.navrow button{font-family:var(--mono);font-size:13px;padding:10px 16px;border-radius:999px;
  border:1px solid var(--line);background:transparent;color:var(--dim);cursor:pointer}
.back:hover,.navrow button:hover{border-color:var(--accent);color:var(--ink)}
.hero{width:100%;border-radius:14px;border:1px solid var(--line);margin:22px 0 34px;display:block}
.navrow{display:flex;justify-content:space-between;margin:48px 0 10px;gap:12px}
.prose h1{font-size:clamp(30px,5vw,46px);line-height:1.05;letter-spacing:-.02em;margin:0 0 20px}
.prose h2{font-size:24px;margin:36px 0 12px}
.prose p{margin:0 0 20px;font-size:18px}
.prose blockquote{border-left:3px solid var(--accent);padding:6px 0 6px 18px;margin:0 0 26px;
  color:var(--dim);font-family:var(--mono);font-size:14px;letter-spacing:.04em}
.prose hr{border:0;border-top:1px solid var(--line);margin:36px 0}
.prose ul{margin:0 0 22px 22px}.prose li{margin-bottom:8px;color:var(--dim);font-size:16px}
.prose strong{color:var(--ink)}
.prose code{font-family:var(--mono);font-size:.9em;background:var(--panel);padding:2px 6px;border-radius:4px}
.aside{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--amber);
  border-radius:0 10px 10px 0;padding:16px 20px;margin:0 0 24px;font-size:16px;color:var(--dim)}
.tw{overflow-x:auto;margin:0 0 24px}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--line)}
th{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
.mapwrap{position:relative;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:#04060A}
#sky{display:block;width:100%;height:clamp(380px,62vh,720px);cursor:grab;touch-action:none}
#sky:active{cursor:grabbing}
.hud{position:absolute;left:16px;top:14px;font-family:var(--mono);font-size:11px;letter-spacing:.08em;
  color:#7C8A9C;background:rgba(4,6,10,.72);padding:8px 12px;border-radius:8px;pointer-events:none;max-width:78%}
.hud b{color:#C8D6E6}
.cnt{position:absolute;right:18px;top:14px;text-align:right;font-family:var(--mono);pointer-events:none}
.cnt span{display:block;font-size:32px;font-weight:700;color:#D9A441;line-height:1}
.cnt small{font-size:10px;letter-spacing:.24em;color:#6B7684}
.timeline{margin:22px 0 8px}
.timeline label{display:block;font-family:var(--mono);font-size:11px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--faint);margin-bottom:12px}
#tl{width:100%;accent-color:var(--amber);height:4px}
.tlab{display:flex;justify-content:space-between;gap:10px;font-family:var(--mono);
  font-size:11px;color:var(--faint);margin-top:10px;flex-wrap:wrap}
#tnow{color:var(--amber)}
.legend{display:flex;flex-wrap:wrap;gap:8px 22px;margin-top:22px;font-family:var(--mono);
  font-size:11px;color:var(--faint);letter-spacing:.05em}
.legend span{display:flex;align-items:center;gap:8px}
.legend i.d{width:10px;height:10px;border-radius:50%;display:inline-block}
.d.lit{background:#8FD3FF}.d.open{background:#7EE787}.d.con{background:#39424E}
.d.ruin{background:transparent;border:1px dashed #8A6A2F}.d.fence{background:#D9A441;border-radius:1px;height:2px;width:16px}
footer{margin-top:64px;padding-top:22px;border-top:1px solid var(--line);
  font-family:var(--mono);font-size:12px;color:var(--faint);display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}
@media(max-width:520px){.grid{grid-template-columns:1fr}}
</style>

<div class="wrap">
  <div id="home">
    <header class="top"><span class="brand">The Morkinstar Journals</span></header>
    <h1 class="title">Fourteen gods.<br>Fourteen monsters.<br>Thirteen names.</h1>
    <p class="tag">Field entries from a correspondent who visits worlds that cannot yet leave them,
      and writes down the story each one tells about its own weather. Every entry stands alone.
      Read them in order and a second thing happens.</p>
    <div class="seasons">
      <button data-season="1" aria-pressed="true">Season One · The Directory</button>
      <button data-season="2" aria-pressed="false">Season Two · The Ninety-One Pages</button>
      <button data-season="3" aria-pressed="false">The Starmap</button>
    </div>
    <p class="note" id="snote"></p>
    <div class="grid" id="grid"></div>

    <div id="map" hidden>
      <div class="mapwrap">
        <canvas id="sky"></canvas>
        <div class="hud" id="hud"><b>Drag to turn.</b> Scroll to close. Click a world to read it.</div>
        <div class="cnt"><span id="cnum">611</span><small>CONCLUDED</small></div>
      </div>
      <div class="timeline">
        <label for="tl">The account, over time</label>
        <input type="range" id="tl" min="611" max="671" value="611">
        <div class="tlab"><span>#2296 · six hundred and eleven</span><span id="tnow"></span><span>Page 91 · six hundred and seventy-one</span></div>
      </div>
      <div class="legend">
        <span><i class="d lit"></i>Filed, and still open</span>
        <span><i class="d open"></i>The only open file in the sky</span>
        <span><i class="d con"></i>Concluded. Populated. Well.</span>
        <span><i class="d ruin"></i>A world that survives only as an error</span>
        <span><i class="d fence"></i>Fences, aimed at each other</span>
      </div>
    </div>
    <footer>
      <span>Season One: ${s1.length} entries · Season Two: ${s2.length} of 91 pages</span>
      <span>Eighty-one still blank.</span>
    </footer>
  </div>
  <div id="readers">${all.map(reader).join("\n")}</div>
</div>

<script>
const DATA = ${JSON.stringify(all.map((e) => ({ s: e.season, i: e.idx })))};
const CARDS = { 1: ${JSON.stringify(s1.map(card))}, 2: ${JSON.stringify(s2.map(card))} };
const NOTE = {
  1: "Filed to the Galactic Directory. Entry numbers are global; series positions are per system, so the gaps are real. He travels.",
  2: "Not filed. Each page must contain something nobody has ever written down. The page numbers skip because the ones between exist and he did not show us.",
  3: "Every world he has filed, and the six hundred and seventy-one he never reached. Drag the axis and the sky goes out behind him."
};
const MAP = ${JSON.stringify(STARMAP)};
const grid = document.getElementById('grid'), home = document.getElementById('home'),
      readers = document.getElementById('readers'), snote = document.getElementById('snote'),
      mapEl = document.getElementById('map');
let season = 1;

function paint(){
  document.body.classList.toggle('s2', season === 2);
  const isMap = season === 3;
  grid.hidden = isMap; mapEl.hidden = !isMap;
  if (!isMap) grid.innerHTML = CARDS[season].join('');
  snote.textContent = NOTE[season];
  document.querySelectorAll('.seasons button').forEach(b =>
    b.setAttribute('aria-pressed', String(Number(b.dataset.season) === season)));
  if (isMap) sky.resize();
}

/* ── the starmap ──────────────────────────────────────────────────────────
   Perspective projection by hand, painter's algorithm for depth. The point of
   the time axis is not the named worlds. It is the field behind them: six
   hundred and eleven going to six hundred and seventy-one while he writes. */
const sky = (() => {
  const cv = document.getElementById('sky'), ctx = cv.getContext('2d');
  const cnum = document.getElementById('cnum'), tl = document.getElementById('tl'),
        tnow = document.getElementById('tnow'), hud = document.getElementById('hud');
  let W = 0, H = 0, rx = -0.32, ry = 0.5, zoom = 1, count = 611, hover = null;
  // In-system offsets get spread so labels in a tight cluster (Alpha Axmoiri has
  // three worlds) do not sit on top of each other, and systems pull in to keep
  // the overall extent the same.
  const SPREAD = 2.6, PULL = 0.82;
  const named = MAP.worlds.map(w => {
    const s = MAP.systems[w.s] || [0,0,0];
    return { ...w, p: [s[0]*PULL + w.o[0]*SPREAD, s[1]*PULL + w.o[1]*SPREAD, s[2]*PULL + w.o[2]*SPREAD] };
  });
  const byName = Object.fromEntries(named.map(w => [w.n, w]));

  // The field: 671 anonymous worlds on a deterministic scatter, each with the
  // count at which its own file closes. No Math.random, so the sky is the same sky.
  let seed = 20260815;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  // at = i+1, so at a count of C exactly C of them are out. The number in the
  // corner is not a mood. It is how many of these are dark.
  const field = Array.from({ length: 671 }, (_, i) => {
    const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1), r = 240 + rnd() * 560;
    return { p: [r*Math.sin(ph)*Math.cos(th), r*Math.sin(ph)*Math.sin(th)*0.6, r*Math.cos(ph)],
             at: i + 1 };
  });

  const COL = { lit:"#8FD3FF", open:"#7EE787", concluded:"#39424E", ruin:"#8A6A2F", self:"#D9A441" };

  function project(p){
    const [x,y,z] = p;
    const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    const x1 = x*cy - z*sy, z1 = x*sy + z*cy;
    const y1 = y*cx - z1*sx, z2 = y*sx + z1*cx;
    const d = 900, s = d / (d + z2 + 620);
    return [W/2 + x1*s*zoom*1.5, H/2 + y1*s*zoom*1.5, z2, s];
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "#04060A"; ctx.fillRect(0,0,W,H);
    // the field, back to front
    const pts = field.map(f => ({ f, q: project(f.p) })).sort((a,b) => b.q[2] - a.q[2]);
    for (const { f, q } of pts){
      const dark = count >= f.at;
      const a = Math.max(0, Math.min(1, q[3] * 1.15));
      ctx.beginPath();
      ctx.arc(q[0], q[1], Math.max(0.5, 1.5 * q[3] * zoom), 0, 6.283);
      ctx.fillStyle = dark ? \`rgba(46,54,66,\${a*0.75})\` : \`rgba(190,215,240,\${a*0.42})\`;
      ctx.fill();
    }
    // fences
    ctx.lineWidth = 1.2;
    for (const [a,b] of MAP.fences){
      const A = byName[a], B = byName[b]; if (!A || !B) continue;
      const p = project(A.p), q = project(B.p);
      const g = ctx.createLinearGradient(p[0],p[1],q[0],q[1]);
      g.addColorStop(0, "rgba(217,164,65,0.55)"); g.addColorStop(1, "rgba(217,164,65,0.06)");
      ctx.strokeStyle = g; ctx.setLineDash([5,6]);
      ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke();
    }
    ctx.setLineDash([]);
    // named worlds
    const ws = named.map(w => ({ w, q: project(w.p) })).sort((a,b) => b.q[2] - a.q[2]);
    hover = hover && ws.find(o => o.w.n === hover.w.n) ? hover : null;
    for (const o of ws){
      const { w, q } = o;
      const dark = w.at != null && count >= w.at;
      const col = dark ? COL.concluded : COL[w.st];
      const r = Math.max(2.5, 5.5 * q[3] * zoom);
      o.sx = q[0]; o.sy = q[1]; o.r = r;
      if (w.st !== "concluded" && !dark){
        const g = ctx.createRadialGradient(q[0],q[1],0,q[0],q[1],r*6);
        g.addColorStop(0, col + "66"); g.addColorStop(1, col + "00");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0],q[1],r*6,0,6.283); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(q[0],q[1],r,0,6.283);
      if (w.st === "ruin"){ ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.setLineDash([2,3]); ctx.stroke(); ctx.setLineDash([]); }
      else { ctx.fillStyle = col; ctx.fill(); }
      if (w.st === "self"){ ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(q[0],q[1],r*2.4,0,6.283); ctx.stroke(); }
      const big = q[3] > 0.55 || hover?.w.n === w.n;
      if (big){
        ctx.font = "500 12px ui-monospace, SF Mono, Menlo, monospace";
        ctx.fillStyle = dark ? "#5C6878" : "#C8D6E6";
        ctx.fillText(w.n, q[0] + r + 7, q[1] + 4);
      }
    }
    window.__ws = ws;
  }

  function resize(){
    const r = cv.getBoundingClientRect();
    W = cv.width = Math.floor(r.width * devicePixelRatio);
    H = cv.height = Math.floor(r.height * devicePixelRatio);
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
    W = r.width; H = r.height; draw();
  }

  let drag = null;
  cv.addEventListener('pointerdown', e => { drag = { x:e.clientX, y:e.clientY, rx, ry }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointerup', () => drag = null);
  cv.addEventListener('pointermove', e => {
    if (drag){ ry = drag.ry + (e.clientX - drag.x) * 0.006; rx = Math.max(-1.3, Math.min(1.3, drag.rx + (e.clientY - drag.y) * 0.006)); draw(); return; }
    const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    const hit = (window.__ws || []).find(o => Math.hypot(o.sx - mx, o.sy - my) < Math.max(10, o.r + 8));
    if (hit !== hover){ hover = hit || null; cv.style.cursor = hit?.w.k ? 'pointer' : 'grab';
      hud.innerHTML = hover ? \`<b>\${hover.w.n}</b> · \${hover.w.d}\${hover.w.k ? ' · click to read' : ''}\`
        : '<b>Drag to turn.</b> Scroll to close. Click a world to read it.';
      draw(); }
  });
  cv.addEventListener('click', () => { if (hover?.w.k) open(hover.w.k); });
  cv.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.max(0.45, Math.min(3, zoom * (e.deltaY > 0 ? 0.92 : 1.08))); draw(); }, { passive:false });
  tl.addEventListener('input', () => {
    count = Number(tl.value); cnum.textContent = count;
    const pct = (count - 611) / 60;
    tnow.textContent = pct < 0.02 ? 'the end of Season One' : pct > 0.98 ? 'the end of Season Two' : \`\${count} and rising\`;
    draw();
  });
  addEventListener('resize', () => { if (season === 3) resize(); });
  return { resize, draw };
})();
function open(key){
  const [s] = key.split('-').map(Number);
  season = s; paint();
  home.hidden = true;
  readers.querySelectorAll('.read').forEach(r => r.hidden = true);
  const el = document.getElementById('r-' + key);
  if (el) el.hidden = false;
  window.scrollTo(0, 0);
  location.hash = key;
}
function close(){
  home.hidden = false;
  readers.querySelectorAll('.read').forEach(r => r.hidden = true);
  window.scrollTo(0, 0);
  history.replaceState(null, '', location.pathname);
}
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]');
  if (o) { open(o.dataset.open); return; }
  if (e.target.closest('[data-back]')) { close(); return; }
  const s = e.target.closest('[data-season]');
  if (s) { season = Number(s.dataset.season); paint(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && home.hidden) close(); });
paint();
if (location.hash) { const k = location.hash.slice(1); if (document.getElementById('r-' + k)) open(k); }
</script>`;

const outFile = join(FIC, "site.html");
writeFileSync(outFile, html);
console.log(`  site.html  ${(html.length / 1e6).toFixed(2)} MB`);
