#!/usr/bin/env node
// Render a lesson's carousel (assets/carousel.json) into slide PNGs + a single
// LinkedIn-ready PDF (document post = top reach format).
//
//   node scripts/carousel.mjs lessons/<lesson-dir>
//
// Writes <dir>/assets/carousel/slide-NN.png and <dir>/assets/carousel.pdf
//
// Slide types (set "type" per slide, default "statement"):
//   cover      big hook, ghost numeral, swipe cue
//   statement  headline + body copy
//   code       Kotlin panel with syntax highlighting + optional callout
//   diagram    a named figure from FIGURES + caption
//   fixes      numbered fix cards
//   takeaway   centred payload line + sign-off
//
// Text is NOT auto-wrapped (resvg gives no measurement API), so every field takes
// an array of explicit lines. That is deliberate: the line breaks are a design
// decision, not a side effect of a font metric.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { PDFDocument } from "pdf-lib";
import { highlight as hl, esc } from "./kotlin-highlight.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const lessonDir = process.argv[2];
if (!lessonDir) { console.error("usage: node scripts/carousel.mjs lessons/<dir>"); process.exit(1); }

const dataPath = resolve(lessonDir, "assets/carousel.json");
if (!existsSync(dataPath)) { console.error(`no carousel data at ${dataPath}`); process.exit(1); }
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const slides = data.slides || [];
const W = 1080, H = 1350;

// ── design tokens ────────────────────────────────────────────────────────────
const T = {
  bg0: "#080A0E", bg1: "#0F131A",
  ink: "#EDF2F7", inkDim: "#9FB0C2", inkFaint: "#5A6675",
  panel: "#04060A", line: "#1C2430",
  sans: "'SF Pro Display','Helvetica Neue','Inter',sans-serif",
  mono: "'SF Mono','JetBrains Mono',Menlo,monospace",
};
const ACCENT = data.accent || "#7c5cff";
const highlight = (line, x, y, size) => hl(line, x, y, size, T.mono);

// ── chrome shared by every slide ─────────────────────────────────────────────
function frame(i, n, s) {
  const pct = ((i + 1) / n) * 100;
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${T.bg1}"/><stop offset="1" stop-color="${T.bg0}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.12" cy="0.06" r="0.75">
      <stop offset="0" stop-color="${ACCENT}" stop-opacity="0.20"/>
      <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="rail" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${ACCENT}"/><stop offset="1" stop-color="${ACCENT}" stop-opacity="0.25"/>
    </linearGradient>
    <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.5" fill="${T.inkFaint}" fill-opacity="0.16"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect x="0" y="0" width="10" height="${H}" fill="url(#rail)"/>

  <rect x="80" y="1214" width="920" height="1.5" fill="${T.line}"/>
  <circle cx="92" cy="1266" r="12" fill="none" stroke="${ACCENT}" stroke-width="3"/>
  <circle cx="92" cy="1266" r="4.5" fill="${ACCENT}"/>
  <text x="118" y="1276" fill="${T.ink}" font-family="${T.mono}" font-size="28" font-weight="600">${esc(data.brand || "The Loopdown")}</text>
  <text x="80" y="1316" fill="${T.inkFaint}" font-family="${T.mono}" font-size="24">${esc(data.handle || "")}</text>
  <text x="1000" y="1276" fill="${ACCENT}" font-family="${T.mono}" font-size="30" font-weight="700" text-anchor="end">${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}</text>
  <text x="1000" y="1316" fill="${T.inkFaint}" font-family="${T.mono}" font-size="24" text-anchor="end">${esc(i < n - 1 ? (s.arrow || "swipe") : (s.arrow || ""))}</text>
  <rect x="80" y="1334" width="920" height="3" rx="1.5" fill="${T.line}"/>
  <rect x="80" y="1334" width="${(920 * pct / 100).toFixed(1)}" height="3" rx="1.5" fill="${ACCENT}"/>`;
}

const kicker = (s, y = 148) =>
  s.kicker ? `<text x="80" y="${y}" fill="${ACCENT}" font-family="${T.mono}" font-size="28" letter-spacing="4">// ${esc(String(s.kicker).toUpperCase())}</text>` : "";

const headline = (lines, y0, size = 80, lead = 96) =>
  lines.map((l, i) =>
    `<text x="78" y="${y0 + i * lead}" fill="${i === lines.length - 1 && lines.length > 1 ? ACCENT : T.ink}" font-family="${T.sans}" font-size="${size}" font-weight="800" letter-spacing="-1.5">${esc(l)}</text>`
  ).join("");

const body = (lines, y0, size = 40, lead = 62) =>
  lines.map((l, i) => l === "" ? "" :
    `<text x="80" y="${y0 + i * lead}" fill="${T.inkDim}" font-family="${T.sans}" font-size="${size}">${esc(l)}</text>`
  ).join("");

// ── figures: hand-built diagrams, referenced by name from carousel.json ──────
const FIGURES = {
  // A cancellation signal travelling up the suspend stack and being swallowed
  // by a broad catch. The point of the whole post, drawn.
  "messenger-intercepted": () => {
    const boxes = [
      { y: 900, label: "api.search(query)", note: "suspend call" },
      { y: 780, label: "try { ... }", note: "" },
      { y: 660, label: "catch (e: Exception)", note: "swallows it", bad: true },
      { y: 540, label: "your coroutine", note: "never hears it", ghost: true },
    ];
    let out = "";
    // travel arrow
    out += `<line x1="150" y1="925" x2="150" y2="600" stroke="${ACCENT}" stroke-width="4" stroke-dasharray="12 10" opacity="0.55"/>`;
    out += `<text x="150" y="975" fill="${ACCENT}" font-family="${T.mono}" font-size="24" text-anchor="middle">cancel()</text>`;
    for (const b of boxes) {
      const stroke = b.bad ? "#FF6B81" : b.ghost ? T.inkFaint : T.line;
      const dash = b.ghost ? ` stroke-dasharray="10 8"` : "";
      out += `<rect x="210" y="${b.y - 46}" width="720" height="92" rx="14" fill="${T.panel}" stroke="${stroke}" stroke-width="2.5"${dash}/>`;
      out += `<text x="248" y="${b.y + 10}" fill="${b.bad ? "#FF9AAB" : b.ghost ? T.inkFaint : T.inkDim}" font-family="${T.mono}" font-size="30">${esc(b.label)}</text>`;
      if (b.note) out += `<text x="906" y="${b.y + 10}" fill="${b.bad ? "#FF6B81" : T.inkFaint}" font-family="${T.sans}" font-size="26" text-anchor="end">${esc(b.note)}</text>`;
    }
    // the wall: signal stops at the catch
    out += `<line x1="150" y1="660" x2="196" y2="660" stroke="#FF6B81" stroke-width="4"/>`;
    out += `<circle cx="150" cy="660" r="15" fill="none" stroke="#FF6B81" stroke-width="4"/>`;
    out += `<line x1="140" y1="650" x2="160" y2="670" stroke="#FF6B81" stroke-width="4"/>`;
    out += `<line x1="160" y1="650" x2="140" y2="670" stroke="#FF6B81" stroke-width="4"/>`;
    // signal that should have continued
    out += `<line x1="150" y1="640" x2="150" y2="560" stroke="${T.inkFaint}" stroke-width="3" stroke-dasharray="6 12" opacity="0.4"/>`;
    return out;
  },

  // Same stack, message gets through: narrow catch + rethrow.
  "messenger-through": () => {
    const boxes = [
      { y: 900, label: "api.search(query)" },
      { y: 780, label: "catch (e: CancellationException)", note: "throw e", ok: true },
      { y: 660, label: "catch (e: IOException)", note: "your real error" },
      { y: 540, label: "coroutine unwinds", note: "clean shutdown", ok: true },
    ];
    let out = "";
    out += `<line x1="150" y1="925" x2="150" y2="500" stroke="#7EE787" stroke-width="4" stroke-dasharray="12 10"/>`;
    out += `<polygon points="150,486 141,510 159,510" fill="#7EE787"/>`;
    out += `<text x="150" y="975" fill="#7EE787" font-family="${T.mono}" font-size="24" text-anchor="middle">cancel()</text>`;
    for (const b of boxes) {
      const stroke = b.ok ? "#7EE787" : T.line;
      out += `<rect x="210" y="${b.y - 46}" width="720" height="92" rx="14" fill="${T.panel}" stroke="${stroke}" stroke-width="2.5"/>`;
      out += `<text x="248" y="${b.y + 10}" fill="${b.ok ? "#9DECB0" : T.inkDim}" font-family="${T.mono}" font-size="28">${esc(b.label)}</text>`;
      if (b.note) out += `<text x="906" y="${b.y + 10}" fill="${b.ok ? "#7EE787" : T.inkFaint}" font-family="${T.sans}" font-size="26" text-anchor="end">${esc(b.note)}</text>`;
    }
    return out;
  },
};

// ── slide renderers ──────────────────────────────────────────────────────────
const RENDER = {
  cover: (s) => `
    <text x="612" y="470" fill="${ACCENT}" fill-opacity="0.07" font-family="${T.sans}" font-size="420" font-weight="800">${esc(s.ghost || "?")}</text>
    ${kicker(s)}
    ${headline(s.head || [], 330, 88, 104)}
    ${body(s.body || [], 760)}`,

  statement: (s) => `${kicker(s)}${headline(s.head || [], 320)}${body(s.body || [], 700)}`,

  code: (s) => {
    const code = s.code || [];
    const lineH = 46, panelH = code.length * lineH + 76;
    // centre the panel+callout block in the space between headline and footer
    const calloutH = s.callout ? s.callout.length * 46 + 34 + 62 : 0;
    const panelY = Math.max(440, 470 + (620 - (panelH + calloutH)) / 2);
    let out = kicker(s) + headline(s.head || [], 300, 66, 82);
    out += `<rect x="78" y="${panelY}" width="924" height="${panelH}" rx="20" fill="${T.panel}" stroke="${T.line}" stroke-width="2"/>`;
    out += `<circle cx="118" cy="${panelY + 34}" r="8" fill="#FF5F56"/><circle cx="146" cy="${panelY + 34}" r="8" fill="#FFBD2E"/><circle cx="174" cy="${panelY + 34}" r="8" fill="#27C93F"/>`;
    if (s.filename) out += `<text x="210" y="${panelY + 42}" fill="${T.inkFaint}" font-family="${T.mono}" font-size="24">${esc(s.filename)}</text>`;
    code.forEach((l, i) => { out += highlight(l, 118, panelY + 108 + i * lineH, 30); });
    if (s.callout) {
      const cy = panelY + panelH + 62;
      out += `<rect x="78" y="${cy - 44}" width="924" height="${(s.callout.length) * 46 + 34}" rx="14" fill="#FF6B81" fill-opacity="0.10" stroke="#FF6B81" stroke-opacity="0.45" stroke-width="2"/>`;
      s.callout.forEach((l, i) => {
        out += `<text x="112" y="${cy + 2 + i * 46}" fill="#FF9AAB" font-family="${T.sans}" font-size="32" font-weight="${i === 0 ? 700 : 400}">${esc(l)}</text>`;
      });
    }
    return out;
  },

  diagram: (s) => {
    const fig = FIGURES[s.figure];
    if (!fig) throw new Error(`unknown figure "${s.figure}" — add it to FIGURES in scripts/carousel.mjs`);
    return kicker(s) + headline(s.head || [], 300, 66, 82) + fig() +
      (s.caption ? body(s.caption, 1080, 32, 46) : "");
  },

  fixes: (s) => {
    let out = kicker(s) + headline(s.head || [], 300, 70, 86);
    (s.items || []).forEach((it, i) => {
      const y = 480 + i * 172;
      out += `<rect x="78" y="${y}" width="924" height="146" rx="18" fill="${T.panel}" stroke="${T.line}" stroke-width="2"/>`;
      out += `<rect x="78" y="${y}" width="6" height="146" rx="3" fill="${ACCENT}"/>`;
      out += `<text x="126" y="${y + 60}" fill="${ACCENT}" font-family="${T.mono}" font-size="30" font-weight="700">0${i + 1}</text>`;
      out += `<text x="196" y="${y + 60}" fill="${T.ink}" font-family="${T.sans}" font-size="38" font-weight="700">${esc(it.title)}</text>`;
      if (it.sub) out += `<text x="196" y="${y + 112}" fill="${T.inkDim}" font-family="${T.mono}" font-size="28">${esc(it.sub)}</text>`;
    });
    return out;
  },

  takeaway: (s) => {
    let out = kicker(s);
    out += `<rect x="78" y="300" width="90" height="5" rx="2.5" fill="${ACCENT}"/>`;
    out += (s.head || []).map((l, i) =>
      `<text x="78" y="${400 + i * 96}" fill="${i === (s.head.length - 1) ? ACCENT : T.ink}" font-family="${T.sans}" font-size="76" font-weight="800" letter-spacing="-1.5">${esc(l)}</text>`
    ).join("");
    out += body(s.body || [], 400 + (s.head || []).length * 96 + 90);
    return out;
  },
};

// ── build ────────────────────────────────────────────────────────────────────
const outDir = resolve(lessonDir, "assets/carousel");
mkdirSync(outDir, { recursive: true });
const pdf = await PDFDocument.create();

for (let i = 0; i < slides.length; i++) {
  const s = slides[i];
  const render = RENDER[s.type || "statement"];
  if (!render) throw new Error(`slide ${i + 1}: unknown type "${s.type}"`);
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${frame(i, slides.length, s)}${render(s)}</svg>`;

  const png = new Resvg(svg, { fitTo: { mode: "width", value: W } }).render().asPng();
  writeFileSync(join(outDir, `slide-${String(i + 1).padStart(2, "0")}.png`), png);

  const img = await pdf.embedPng(png);
  pdf.addPage([W, H]).drawImage(img, { x: 0, y: 0, width: W, height: H });
}

writeFileSync(resolve(lessonDir, "assets/carousel.pdf"), await pdf.save());
console.log(`carousel: ${slides.length} slides`);
console.log(`  PNGs → ${outDir}/slide-*.png`);
console.log(`  PDF  → ${lessonDir}/assets/carousel.pdf  (upload as a LinkedIn document post)`);
