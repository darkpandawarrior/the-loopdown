#!/usr/bin/env node
// Render a lesson's carousel (assets/carousel.json) into slide PNGs + a single
// LinkedIn-ready PDF (document post = top reach format).
//
//   node scripts/carousel.mjs lessons/<lesson-dir>
//
// Writes <dir>/assets/carousel/slide-NN.png and <dir>/assets/carousel.pdf
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { PDFDocument } from "pdf-lib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const lessonDir = process.argv[2];
if (!lessonDir) { console.error("usage: node scripts/carousel.mjs lessons/<dir>"); process.exit(1); }

const dataPath = resolve(lessonDir, "assets/carousel.json");
if (!existsSync(dataPath)) { console.error(`no carousel data at ${dataPath}`); process.exit(1); }
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const slides = data.slides || [];
const W = 1080, H = 1350;

const tpl = readFileSync(join(ROOT, "templates", "svg", "carousel-slide.svg"), "utf8");
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const outDir = resolve(lessonDir, "assets/carousel");
mkdirSync(outDir, { recursive: true });

const pdf = await PDFDocument.create();
const pngPaths = [];

for (let i = 0; i < slides.length; i++) {
  const s = slides[i];
  const head = s.head || [], body = s.body || [];
  let svg = tpl
    .replaceAll("{{ACCENT}}", esc(s.accent || data.accent || "#7c5cff"))
    .replaceAll("{{KICKER}}", esc((s.kicker || "").toUpperCase()))
    .replaceAll("{{BRAND}}", esc(data.brand || "The Loopdown"))
    .replaceAll("{{HANDLE}}", esc(data.handle || ""))
    .replaceAll("{{PAGEN}}", String(i + 1).padStart(2, "0"))
    .replaceAll("{{PAGES}}", String(slides.length).padStart(2, "0"))
    .replaceAll("{{ARROW}}", esc(i < slides.length - 1 ? (s.arrow || "swipe >") : (s.arrow || "")));
  for (let n = 1; n <= 3; n++) svg = svg.replaceAll(`{{HEAD_${n}}}`, esc(head[n - 1] ?? ""));
  for (let n = 1; n <= 5; n++) svg = svg.replaceAll(`{{BODY_${n}}}`, esc(body[n - 1] ?? ""));
  svg = svg.replace(/\{\{[A-Z0-9_]+\}\}/g, "");

  const png = new Resvg(svg, { fitTo: { mode: "width", value: W } }).render().asPng();
  const p = join(outDir, `slide-${String(i + 1).padStart(2, "0")}.png`);
  writeFileSync(p, png);
  pngPaths.push(p);

  const img = await pdf.embedPng(png);
  const page = pdf.addPage([W, H]);
  page.drawImage(img, { x: 0, y: 0, width: W, height: H });
}

const pdfBytes = await pdf.save();
const pdfPath = resolve(lessonDir, "assets/carousel.pdf");
writeFileSync(pdfPath, pdfBytes);

console.log(`carousel: ${slides.length} slides`);
console.log(`  PNGs → ${outDir}/slide-*.png`);
console.log(`  PDF  → ${pdfPath}  (upload as a LinkedIn document post)`);
