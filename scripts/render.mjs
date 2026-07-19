#!/usr/bin/env node
// Fill an SVG template with a lesson's card data and render it to PNG.
//
//   node scripts/render.mjs lessons/<lesson-dir>
//
// Reads <lesson-dir>/assets/card.yaml, fills templates/svg/<template>.svg,
// writes <lesson-dir>/assets/card.svg (filled) and card.png (1200x1200).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const lessonDir = process.argv[2];
if (!lessonDir) {
  console.error("usage: node scripts/render.mjs lessons/<lesson-dir>");
  process.exit(1);
}
const cardPath = resolve(lessonDir, "assets/card.yaml");
if (!existsSync(cardPath)) {
  console.error(`no card data at ${cardPath}`);
  process.exit(1);
}

// Minimal YAML reader: `key: value` and `key:` + `  - item` lists. No deps.
function parseCard(text) {
  const out = {};
  let curKey = null;
  for (const raw of text.split("\n")) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    const listItem = raw.match(/^\s*-\s+(.*)$/);
    if (listItem && curKey) {
      (out[curKey] ||= []).push(unquote(listItem[1]));
      continue;
    }
    const kv = raw.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (kv) {
      curKey = kv[1];
      out[curKey] = kv[2] === "" ? [] : unquote(kv[2]);
    }
  }
  return out;
}
const unquote = (s) => s.replace(/^["']|["']$/g, "").trim();
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const card = parseCard(readFileSync(cardPath, "utf8"));
const accent = card.accent || "#7c5cff";
const templateName = card.template || "code-card";
const tplPath = join(ROOT, "templates", "svg", `${templateName}.svg`);
let svg = readFileSync(tplPath, "utf8");

// Field map. Arrays fill indexed placeholders (CODE_1..7, TITLE_1..2, TAKEAWAY_1..2).
const scalars = {
  ACCENT: accent,
  PILLAR: (card.pillar || "").toUpperCase(),
  HANDLE: card.handle || "@siddharthpandalai",
};
for (const [k, v] of Object.entries(scalars)) {
  svg = svg.replaceAll(`{{${k}}}`, esc(v));
}
const arrays = { TITLE: card.title, CODE: card.code, TAKEAWAY: card.takeaway };
for (const [key, arr] of Object.entries(arrays)) {
  const list = Array.isArray(arr) ? arr : arr ? [arr] : [];
  // Fill up to a generous max; blank out any unused indexed slots.
  for (let i = 1; i <= 12; i++) {
    svg = svg.replaceAll(`{{${key}_${i}}}`, esc(list[i - 1] ?? ""));
  }
}
// Any leftover placeholders -> blank (keeps render clean if template has extras).
svg = svg.replace(/\{\{[A-Z0-9_]+\}\}/g, "");

const filledSvgPath = resolve(lessonDir, "assets/card.svg");
writeFileSync(filledSvgPath, svg);

const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
const pngPath = resolve(lessonDir, "assets/card.png");
writeFileSync(pngPath, png);

console.log(`rendered:\n  ${filledSvgPath}\n  ${pngPath}`);
