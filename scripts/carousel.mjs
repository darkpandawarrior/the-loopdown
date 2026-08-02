#!/usr/bin/env node
// Render a lesson's carousel (assets/carousel.json) into slide PNGs + a single
// LinkedIn-ready PDF (document post = top reach format).
//
//   node scripts/carousel.mjs lessons/<lesson-dir> [--open]
//
// Slides are laid out as HTML and screenshotted through Chromium, so body copy
// WRAPS BY ITSELF. The old resvg path had no text metrics, which is why every
// line used to be hand-broken in carousel.json. Headlines still take an array
// because there the break is a design decision, not a measurement.
//
// Slide types:
//   cover      hook + ghost numeral + a cast portrait bleeding off the edge
//   statement  headline + prose
//   code       Kotlin panel, syntax highlighted, optional red callout
//   diagram    a named figure from design-kit's FIGURES
//   character  a specimen plate for a lore/cast.md character
//   fixes      numbered cards
//   takeaway   the payload line
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { highlightHtml } from "./kotlin-highlight.mjs";
import { css } from "./slide-css.mjs";
import { FIGURES, portrait, castMeta, esc } from "./design-kit.mjs";

const args = process.argv.slice(2);
const lessonDir = args.find((a) => !a.startsWith("--"));
if (!lessonDir) { console.error("usage: node scripts/carousel.mjs lessons/<dir>"); process.exit(1); }

const dataPath = resolve(lessonDir, "assets/carousel.json");
if (!existsSync(dataPath)) { console.error(`no carousel data at ${dataPath}`); process.exit(1); }
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const slides = data.slides || [];
const ACCENT = data.accent || "#7c5cff";
const W = 1080, H = 1350;

// Headline lines: last line gets the accent unless the author marks one with *.
const headHtml = (lines = []) => lines.map((l, i) => {
  const starred = /^\*/.test(l);
  const text = esc(l.replace(/^\*/, ""));
  const hi = starred || (i === lines.length - 1 && lines.length > 1);
  return hi ? `<span class="hi glow">${text}</span>` : text;
}).join("<br>");

// Body: array or string. "" starts a new paragraph; everything else flows and wraps.
const bodyHtml = (b) => {
  if (!b) return "";
  const parts = (Array.isArray(b) ? b : [b]).reduce((acc, l) => {
    if (l === "") acc.push([]); else acc[acc.length - 1].push(l);
    return acc;
  }, [[]]);
  return parts.filter((p) => p.length).map((p) => `<p>${esc(p.join(" "))}</p>`).join("");
};

const RENDER = {
  cover: (s) => `
    ${s.ghost ? `<div class="ghost">${esc(s.ghost)}</div>` : ""}
    ${s.cast ? `<div class="cover-art">${portrait(s.cast, ACCENT)}</div>` : ""}
    <div class="kicker">${esc(s.kicker || "")}</div>
    <h1>${headHtml(s.head)}</h1>
    <div class="spacer"></div>
    <div class="body lede">${bodyHtml(s.body)}</div>`,

  statement: (s) => `
    <div class="kicker">${esc(s.kicker || "")}</div>
    <h1>${headHtml(s.head)}</h1>
    <div class="spacer"></div>
    <div class="body">${bodyHtml(s.body)}</div>
    <div class="spacer"></div>`,

  code: (s) => `
    <div class="kicker">${esc(s.kicker || "")}</div>
    <h1 class="sm">${headHtml(s.head)}</h1>
    <div class="spacer"></div>
    <div class="panel code">
      <div class="chrome">
        <span class="dot" style="background:#FF5F56"></span>
        <span class="dot" style="background:#FFBD2E"></span>
        <span class="dot" style="background:#27C93F"></span>
        ${s.filename ? `<span class="fname">${esc(s.filename)}</span>` : ""}
      </div>
      <pre>${(s.code || []).map(highlightHtml).join("\n")}</pre>
    </div>
    ${s.callout ? `<div class="callout"><b>${esc(s.callout[0])}</b>${esc(s.callout.slice(1).join(" "))}</div>` : ""}
    <div class="spacer"></div>`,

  diagram: (s) => {
    const fig = FIGURES[s.figure];
    if (!fig) throw new Error(`unknown figure "${s.figure}" — add it to FIGURES in scripts/design-kit.mjs`);
    return `
    <div class="kicker">${esc(s.kicker || "")}</div>
    <h1 class="sm">${headHtml(s.head)}</h1>
    <div class="spacer"></div>
    <div class="fig">${fig(ACCENT)}</div>
    ${s.caption ? `<div class="caption">${esc([].concat(s.caption).join(" "))}</div>` : ""}
    <div class="spacer"></div>`;
  },

  character: (s) => {
    const m = castMeta(s.cast);
    return `
    <div class="kicker">${esc(s.kicker || "")}</div>
    <h1 class="sm">${headHtml(s.head)}</h1>
    <div class="spacer"></div>
    <div class="plate">
      <div class="ticks"><i></i><i></i><i></i><i></i></div>
      <div class="art">${portrait(s.cast, ACCENT)}</div>
      <div class="label">
        <div>
          <div class="nm">${esc(m.name)}</div>
          <div class="cls">${esc(m.className)}</div>
        </div>
        <div class="ex">exhibit ${esc(s.exhibit || "01")}</div>
      </div>
    </div>
    ${s.caption ? `<div class="caption">${esc([].concat(s.caption).join(" "))}</div>` : ""}
    <div class="spacer"></div>`;
  },

  fixes: (s) => `
    <div class="kicker">${esc(s.kicker || "")}</div>
    <h1 class="sm">${headHtml(s.head)}</h1>
    <div class="spacer"></div>
    <div class="fixes">
      ${(s.items || []).map((it, i) => `
      <div class="fix">
        <span class="n">0${i + 1}</span>
        <div class="tx"><div class="tt">${esc(it.title)}</div>${it.sub ? `<div class="ss">${esc(it.sub)}</div>` : ""}</div>
      </div>`).join("")}
    </div>
    <div class="spacer"></div>`,

  takeaway: (s) => `
    <div class="kicker">${esc(s.kicker || "")}</div>
    <div class="spacer"></div>
    <div class="rule"></div>
    <h1>${headHtml(s.head)}</h1>
    <div class="body" style="margin-top:52px">${bodyHtml(s.body)}</div>
    <div class="spacer"></div>`,
};

const page = (s, i, n) => `<!doctype html><html><head><meta charset="utf-8"><style>${css(ACCENT)}</style></head>
<body><div class="slide type-${esc(s.type || "statement")}">
  <div class="rail"></div>
  <div class="content">${(RENDER[s.type || "statement"] || RENDER.statement)(s)}</div>
  <footer>
    <div class="brand">
      <div class="mark"><i></i></div>
      <div>
        <div class="bname">${esc(data.brand || "The Loopdown")}</div>
        <div class="handle">${esc(data.handle || "")}</div>
      </div>
    </div>
    <div class="meta">
      <div class="pg">${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}</div>
      <div class="arrow">${esc(i < n - 1 ? (s.arrow || "swipe") : (s.arrow || ""))}</div>
    </div>
  </footer>
  <div class="progress"><i style="width:${((i + 1) / n) * 100}%"></i></div>
</div></body></html>`;

// ── build ────────────────────────────────────────────────────────────────────
const outDir = resolve(lessonDir, "assets/carousel");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
const pdf = await PDFDocument.create();

for (let i = 0; i < slides.length; i++) {
  const s = slides[i];
  if (!RENDER[s.type || "statement"]) throw new Error(`slide ${i + 1}: unknown type "${s.type}"`);
  await tab.setContent(page(s, i, slides.length), { waitUntil: "load" });
  const png = await tab.screenshot({ type: "png" });          // 2x for crisp type
  writeFileSync(join(outDir, `slide-${String(i + 1).padStart(2, "0")}.png`), png);
  const img = await pdf.embedPng(png);
  pdf.addPage([W, H]).drawImage(img, { x: 0, y: 0, width: W, height: H });
}

await browser.close();
writeFileSync(resolve(lessonDir, "assets/carousel.pdf"), await pdf.save());
console.log(`carousel: ${slides.length} slides @2x`);
console.log(`  PNGs → ${outDir}/slide-*.png`);
console.log(`  PDF  → ${lessonDir}/assets/carousel.pdf  (upload as a LinkedIn document post)`);
