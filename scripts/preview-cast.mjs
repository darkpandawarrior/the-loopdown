#!/usr/bin/env node
// Render every cast portrait as a specimen plate, plus a contact sheet of the
// whole roster, so the drawings can be iterated on without building a carousel.
//
//   node scripts/preview-cast.mjs [outDir]
import { writeFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { defs, ground, specimenPlate, portrait, castIds, castMeta, T } from "./design-kit.mjs";

const outDir = process.argv[2] || "/tmp/cast";
mkdirSync(outDir, { recursive: true });

// Series accents, so the roster is checked in the colours it actually ships in.
const ACCENT = {
  "the-borrowed-hand": "#d9a441",
  "the-messenger": "#4ec9b0",
  "the-concussed-witness": "#7c5cff",
  "the-second-witness": "#7c5cff",
  "the-archivist": "#d9a441",
  "doze-the-jailer": "#ff9f45",
  "the-recomposer": "#4aa3ff",
  "the-understudy": "#c48bff",
  "the-ferryman": "#5ec6d8",
  "the-vault-keeper": "#7EE787",
  "the-fleet": "#4ec9b0",
  "the-backlog": "#ff7b9c",
  "null": "#ff6b81",
  "the-hunter": "#8b98a8",
};

const ids = castIds();
const browser = await chromium.launch();

// individual plates
const tab = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (const id of ids) {
  const a = ACCENT[id] || "#7c5cff";
  const svg = `<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
    ${defs(a)}${ground(1080, 1350)}
    ${specimenPlate(id, a, { x: 150, y: 260, scale: 1.5, exhibit: String(ids.indexOf(id) + 1).padStart(2, "0") })}
  </svg>`;
  await tab.setContent(`<style>body{margin:0}</style>${svg}`, { waitUntil: "load" });
  writeFileSync(`${outDir}/${id}.png`, await tab.screenshot({ type: "png" }));
}

// contact sheet: the whole roster at a glance
const cols = 4, cell = 380, rows = Math.ceil(ids.length / cols);
const sheet = `<!doctype html><html><head><meta charset="utf-8"><style>
 body{margin:0;width:${cols * cell}px;background:#06080B;font-family:${T.sans};color:${T.ink}}
 .g{display:grid;grid-template-columns:repeat(${cols},${cell}px)}
 .c{padding:22px 18px 26px;border:1px solid rgba(255,255,255,.06);position:relative}
 .c svg{width:100%;height:auto;display:block}
 .n{font-size:19px;font-weight:800;letter-spacing:.06em;margin-top:10px}
 .k{font-family:${T.mono};font-size:15px;color:${T.inkFaint};margin-top:5px}
</style></head><body><div class="g">
${ids.map((id) => {
  const a = ACCENT[id] || "#7c5cff";
  const m = castMeta(id);
  return `<div class="c">${portrait(id, a)}<div class="n" style="color:${a}">${m.name}</div><div class="k">${m.className}</div></div>`;
}).join("")}
</div></body></html>`;
const sheetTab = await browser.newPage({ viewport: { width: cols * cell, height: rows * (cell + 90) }, deviceScaleFactor: 1.5 });
await sheetTab.setContent(sheet, { waitUntil: "load" });
writeFileSync(`${outDir}/_contact-sheet.png`, await sheetTab.screenshot({ type: "png", fullPage: true }));

await browser.close();
console.log(`${ids.length} plates + contact sheet → ${outDir}/`);
