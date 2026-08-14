#!/usr/bin/env node
// The Morkinstar Journals — field plates.
//
//   node scripts/morkinstar-plates.mjs            # all 10 + series cover
//   node scripts/morkinstar-plates.mjs 07         # just one
//
// Writes fiction/morkinstar-journals/assets/<NN>-<slug>.png at 1200x1560,
// plus 00-series-cover.png at 1200x630.
//
// House pattern, unchanged: build HTML with inline SVG, screenshot in Chromium.
// Chromium because it has text metrics and wraps body copy by itself, which is
// exactly why carousel.mjs left resvg behind (see the note at the top of that file).
//
// The plate is the Galactic Directory's own survey form, which is the joke: the
// anthology is about an institution that files beautiful records of things it does
// not understand. Chrome is identical on all ten. Only the middle changes.
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { defs, ground, plateTicks, sigil, T, esc } from "./design-kit.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "fiction/morkinstar-journals/assets");
const W = 1200, H = 1560;

// ═══════════════════════════════════════════════════════════════════════════
// ILLUSTRATIONS. Each draws inside a 1000x700 box. One per phenomenon.
// The rule these follow: draw the MECHANISM, not a mood. A reader who has read
// the entry should be able to point at the part of the picture that is the twist.
// ═══════════════════════════════════════════════════════════════════════════
const P = Math.PI;
const pol = (cx, cy, r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
const ln = (x1, y1, x2, y2, s, o = 1, w = 2) =>
  `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${s}" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;
const lbl = (x, y, t, c = T.inkFaint, sz = 17, anchor = "start") =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${T.mono}" font-size="${sz}" fill="${c}" letter-spacing="1.4">${esc(t)}</text>`;

// 01 — Exxobar. A serpent coil torn down the middle; the residue falls as snow.
function exxobar(a) {
  let o = "";
  // the click: 15 momentas round, one half-momenta of warmth
  o += `<circle cx="215" cy="230" r="120" fill="none" stroke="${T.line}" stroke-width="2"/>`;
  for (let i = 0; i < 15; i++) {
    const [x1, y1] = pol(215, 230, 120, (i / 15) * 2 * P - P / 2);
    const [x2, y2] = pol(215, 230, 132, (i / 15) * 2 * P - P / 2);
    o += ln(x1, y1, x2, y2, T.inkFaint, 0.6, 2);
  }
  const [wx, wy] = pol(215, 230, 120, -P / 2);
  o += `<circle cx="${wx.toFixed(1)}" cy="${wy.toFixed(1)}" r="9" fill="${a}"/>`;
  o += lbl(215, 388, "1 CLICK = 15 MOMENTAS", T.inkFaint, 15, "middle");
  o += lbl(215, 410, "WARMTH: 0.5", a, 15, "middle");

  // the serpent, split. two half-spirals pulling apart down a seam.
  const seam = 660;
  for (const dir of [-1, 1]) {
    let d = "";
    for (let t = 0; t <= 1; t += 0.02) {
      const ang = -P / 2 + t * 3.4 * P * dir;
      const r = 34 + t * 128;
      const [x, y] = pol(seam + dir * 26, 230, r, ang);
      d += `${t ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    o += `<path d="${d}" fill="none" stroke="${a}" stroke-opacity="0.9" stroke-width="3" stroke-linecap="round"/>`;
  }
  o += ln(seam, 60, seam, 400, T.danger, 0.5, 2) .replace('stroke-width="2"', 'stroke-width="2" stroke-dasharray="4 8"');
  o += lbl(seam, 424, "THE HALVING", T.danger, 15, "middle");

  // the residue
  o += ln(60, 470, 940, 470, T.line, 1, 2);
  o += lbl(60, 500, "RESIDUE", T.inkFaint, 15);
  const flakes = [[140, 560], [232, 610], [318, 545], [402, 634], [488, 572], [566, 620], [648, 552], [730, 628], [812, 580], [890, 618],
                  [186, 648], [356, 596], [524, 650], [700, 596], [860, 546]];
  for (const [x, y] of flakes) {
    o += ln(x - 8, y, x + 8, y, a, 0.85, 2) + ln(x, y - 8, x, y + 8, a, 0.85, 2)
       + ln(x - 6, y - 6, x + 6, y + 6, a, 0.5, 2) + ln(x + 6, y - 6, x - 6, y + 6, a, 0.5, 2);
  }
  o += lbl(940, 500, "SNOW", a, 15, "end");
  return o;
}

// 02 — Grïnjdarlay. Ninety-nine names, ninety-eight eaten, one held.
function grinjdarlay(a) {
  let o = "", cx = 500, cy = 300, r = 210;
  o += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${T.line}" stroke-width="2"/>`;
  for (let i = 0; i < 99; i++) {
    const ang = (i / 99) * 2 * P - P / 2;
    const eaten = i !== 0;
    const [x1, y1] = pol(cx, cy, r, ang);
    const [x2, y2] = pol(cx, cy, r + (eaten ? 16 : 52), ang);
    o += ln(x1, y1, x2, y2, eaten ? T.inkFaint : a, eaten ? 0.32 : 1, eaten ? 2 : 4);
    if (eaten) { // struck through
      const [sx, sy] = pol(cx, cy, r + 8, ang);
      o += ln(sx - 5, sy - 5, sx + 5, sy + 5, T.danger, 0.4, 1.6);
    }
  }
  o += lbl(cx, cy - r - 66, "THE 99TH", a, 16, "middle");
  o += lbl(cx + r + 44, cy + 6, "98 EATEN", T.danger, 15);
  // the mark: a name with no sound
  o += ln(cx, cy - 64, cx, cy + 64, a, 1, 7);
  o += lbl(cx, cy + 100, "THE MARK", T.ink, 16, "middle");
  o += lbl(cx, cy + 122, "no sound. no hands reach it.", T.inkFaint, 14, "middle");
  // Uhl: a mouth, no face
  o += `<path d="M320 600 Q500 500 680 600 Q500 700 320 600 Z" fill="${T.panel}" stroke="${T.danger}" stroke-opacity="0.7" stroke-width="2.5"/>`;
  o += lbl(500, 664, "UHL · A MOUTH, NO FACE", T.danger, 15, "middle");
  return o;
}

// 03 — Vædrun. Nine days of tide, borrowed once, collected forever.
function vaedrun(a) {
  let o = "";
  const base = 470;
  o += `<path d="M60 ${base} L200 ${base} L260 ${base - 46} L360 ${base - 40} L420 ${base} L640 ${base} L700 ${base - 58} L800 ${base - 30} L860 ${base} L940 ${base}" fill="none" stroke="${T.inkDim}" stroke-width="2.5"/>`;
  // the borrowed line, high and dashed
  o += `<line x1="60" y1="150" x2="940" y2="150" stroke="${a}" stroke-opacity="0.75" stroke-width="2.5" stroke-dasharray="8 8"/>`;
  o += lbl(60, 136, "BORROWED LEVEL · ONCE", a, 15);
  // the collected line, low and solid
  o += `<rect x="60" y="330" width="880" height="${base - 330}" fill="${a}" fill-opacity="0.10"/>`;
  o += ln(60, 330, 940, 330, a, 1, 3);
  o += lbl(940, 362, "COLLECTED LEVEL · EVERY CLICK", a, 15, "end");
  // nine day bars
  for (let i = 0; i < 9; i++) {
    const x = 210 + i * 72;
    o += `<rect x="${x}" y="196" width="26" height="118" fill="${a}" fill-opacity="${0.18 + i * 0.07}" stroke="${a}" stroke-opacity="0.55" stroke-width="1.5"/>`;
    o += lbl(x + 13, 288, String(i + 1), T.bg0, 14, "middle");
  }
  o += lbl(500, 182, "9 DAYS", T.ink, 17, "middle");
  // the ledger, burnt
  o += `<path d="M600 540 H900 V690 H600 Z" fill="${T.panel}" stroke="${T.line}" stroke-width="2"/>`;
  for (let i = 0; i < 6; i++) o += ln(624, 566 + i * 21, 876 - (i > 3 ? 90 : 0), 566 + i * 21, T.inkFaint, 0.45, 2);
  o += `<path d="M840 540 L900 540 L900 690 L800 690 Q846 640 812 606 Q870 584 840 540 Z" fill="${T.bg0}" stroke="${T.danger}" stroke-opacity="0.8" stroke-width="2.5"/>`;
  o += lbl(600, 720, "TERMS: HOW / WHEN / ONCE · NOT RECORDED", T.danger, 15);
  o += lbl(60, 560, "NO HALVING", T.danger, 17);
  o += lbl(60, 588, "IN THIS LEGEND.", T.danger, 17);
  o += lbl(60, 626, "SO IT NEVER", T.inkDim, 17);
  o += lbl(60, 654, "ENDED.", T.inkDim, 17);
  return o;
}

// 04 — Marlt. Two chairs. One occupied. The list with a blank line.
function marlt(a) {
  let o = "";
  // Side-view chairs, so they read as chairs and not as frames round the figures.
  const seat = (x, fy, solid) => {
    const st = solid ? a : T.inkFaint, dash = solid ? "" : ` stroke-dasharray="6 7"`;
    return `<g transform="translate(${x},${fy})" fill="none" stroke="${st}" stroke-opacity="${solid ? 0.95 : 0.6}" stroke-width="3" stroke-linecap="round">
      <path d="M0 0 V-118"${dash}/><path d="M0 -58 H74"${dash}/><path d="M74 -58 V0"${dash}/></g>`;
  };
  const sitter = (x, fy) => `<g transform="translate(${x},${fy})" fill="none" stroke="${T.ink}" stroke-opacity="0.95" stroke-width="3" stroke-linecap="round">
      <circle cx="24" cy="-142" r="23"/><path d="M24 -119 V-58"/><path d="M2 -100 H50"/>
      <path d="M24 -58 H72 L78 -6"/></g>`;
  const ghost = (x, fy) => `<g transform="translate(${x},${fy})" fill="none" stroke="${T.inkFaint}" stroke-opacity="0.5" stroke-width="3" stroke-linecap="round" stroke-dasharray="5 8">
      <circle cx="24" cy="-142" r="23"/><path d="M24 -119 V-58"/><path d="M2 -100 H50"/>
      <path d="M24 -58 H72 L78 -6"/></g>`;
  const floor = 520;
  o += seat(150, floor, true) + sitter(150, floor);
  o += seat(400, floor, false) + ghost(400, floor);
  o += ln(110, floor, 520, floor, T.line, 1, 2);
  o += lbl(190, floor + 34, "ÆR", a, 17, "middle");
  o += lbl(440, floor + 34, "ÆTH", T.inkFaint, 17, "middle");
  o += lbl(110, floor + 78, "HÆLVREN · ADDRESSING THE ABSENT", T.inkDim, 15);
  // the speech arc, going to nobody
  o += `<path d="M200 ${floor - 172} Q315 ${floor - 226} 410 ${floor - 172}" fill="none" stroke="${a}" stroke-opacity="0.7" stroke-width="2.5" stroke-dasharray="3 9"/>`;
  // the sacred list: 14 rows, 13 with a name on them, the 14th genuinely empty
  o += `<rect x="640" y="90" width="300" height="560" rx="10" fill="${T.panel}" fill-opacity="0.85" stroke="${T.line}" stroke-width="2"/>`;
  o += lbl(660, 128, "THE FOURTEEN", T.inkDim, 15);
  for (let i = 0; i < 13; i++) {
    const y = 172 + i * 34;
    o += ln(660, y, 800 + (i % 4) * 26, y, T.inkFaint, 0.75, 3);
  }
  const blankY = 172 + 13 * 34;
  o += ln(660, blankY, 920, blankY, T.danger, 0.28, 1.5).replace('stroke-width="1.5"', 'stroke-width="1.5" stroke-dasharray="3 7"');
  o += lbl(660, blankY - 14, "left blank, on every copy", T.danger, 13);
  o += lbl(640, 690, "A PAIRED CULTURE WITH AN ODD LIST.", T.danger, 15);
  o += lbl(640, 714, "THEY KNOW. THEY WILL NOT FIX IT.", T.inkFaint, 15);
  return o;
}

// 05 — Killuga Var. The eleven count. A test, still running.
function killuga(a) {
  let o = "";
  o += `<circle cx="410" cy="270" r="150" fill="${a}" fill-opacity="0.12" stroke="${a}" stroke-width="3"/>`;
  o += `<circle cx="590" cy="270" r="150" fill="${T.bg0}" fill-opacity="0.6" stroke="${T.inkDim}" stroke-width="3" stroke-dasharray="9 8"/>`;
  for (let i = 0; i < 7; i++) o += ln(300 + i * 12, 200 + i * 4, 316 + i * 12, 188 + i * 4, a, 0.55, 2);
  for (let i = 0; i < 7; i++) o += ln(660 + i * 12, 330 - i * 4, 676 + i * 12, 342 - i * 4, T.inkDim, 0.4, 2);
  o += lbl(410, 452, "WARM · YOURS", a, 16, "middle");
  o += lbl(590, 452, "COLD · WORN", T.inkDim, 16, "middle");
  o += lbl(500, 276, "HOLD", T.ink, 22, "middle");
  // the count
  for (let i = 1; i <= 11; i++) {
    const x = 150 + (i - 1) * 70, on = i === 11;
    o += `<rect x="${x}" y="540" width="52" height="52" rx="8" fill="${on ? a : "none"}" fill-opacity="${on ? 0.9 : 0}" stroke="${on ? a : T.line}" stroke-width="2"/>`;
    o += lbl(x + 26, 573, String(i), on ? T.bg0 : T.inkFaint, 18, "middle");
  }
  o += lbl(150, 522, "AVN  DUR  TRESKH …", T.inkFaint, 15);
  o += lbl(150, 640, "PROTOCOL RUNNING SINCE THE WEARING.", T.inkDim, 16);
  o += lbl(150, 668, "NEVER SWITCHED OFF. NEVER SUCCEEDED.", T.danger, 16);
  return o;
}

// 06 — Jötunheimr. Four billion graves, each surveyed, all aimed at empty sky.
function jotunheimr(a) {
  let o = "";
  // the target: nothing
  o += `<circle cx="820" cy="120" r="46" fill="none" stroke="${T.inkFaint}" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="4 9"/>`;
  o += lbl(752, 104, "NO OBJECT", T.inkFaint, 16, "end");
  o += lbl(752, 128, "VECTOR TERMINATES", T.inkFaint, 13, "end");
  o += lbl(752, 148, "OUTSIDE SURVEY VOLUME", T.inkFaint, 13, "end");
  // the ridge, curving; the graves, not curving
  let ridge = "M40 620";
  const pts = [];
  for (let i = 0; i <= 56; i++) {
    const t = i / 56, x = 40 + t * 900;
    const y = 620 - Math.sin(t * P * 0.9) * 150 - t * 40;
    pts.push([x, y]); ridge += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  o += `<path d="${ridge}" fill="none" stroke="${T.line}" stroke-width="2.5"/>`;
  for (const [x, y] of pts) {
    o += ln(x, y, x, y - 26, a, 0.8, 3);                  // one standing dead
    o += ln(x, y - 26, x + 17, y - 42, a, 0.35, 1.6);     // the fixed bearing
  }
  o += lbl(40, 690, "THE LINE · 11,000 MEASURES · ~4,000,000,000", T.inkDim, 16);
  o += lbl(40, 716, "EVERY GRAVE INDIVIDUALLY SURVEYED TO ⅓°", a, 16);
  o += lbl(40, 200, "THE RIDGE CURVES.", T.ink, 20);
  o += lbl(40, 228, "THE GRAVES DO NOT.", a, 20);
  o += lbl(40, 268, "we are not pointing at it.", T.inkDim, 17);
  o += lbl(40, 292, "we are pointing the way it went.", T.inkDim, 17);
  return o;
}

// 07 — Cendre. Burn everything. Keep one page. A child writes it.
function cendre(a) {
  let o = "";
  // The case, unlocked, up top and alone. What survives.
  o += lbl(500, 50, "NOT LOCKED", T.inkFaint, 15, "middle");
  o += `<rect x="340" y="68" width="320" height="176" rx="8" fill="${T.panel}" fill-opacity="0.9" stroke="${T.line}" stroke-width="2"/>`;
  for (let i = 0; i < 11; i++) o += ln(366, 96 + i * 14, 634, 96 + i * 14, T.inkFaint, 0.5, 2);
  o += lbl(500, 274, "91 PAGES · ONE PER KINDLING", T.inkDim, 16, "middle");
  o += lbl(500, 298, "WRITTEN BY A CHILD · MUST BE NEW", a, 16, "middle");

  // Left: the oldest page, pulled out of the case.
  o += `<path d="M390 250 Q300 300 250 372" fill="none" stroke="${T.line}" stroke-width="2" stroke-dasharray="4 8"/>`;
  o += `<rect x="120" y="384" width="230" height="132" rx="6" fill="${T.paper}" fill-opacity="0.10" stroke="${a}" stroke-width="2.5"/>`;
  o += lbl(235, 446, "▮▮▮▮", T.danger, 30, "middle");
  o += lbl(235, 486, "THE FOURTEENTH'S NAME", T.danger, 14, "middle");
  o += lbl(235, 556, "READ. NOT COPIED.", T.ink, 17, "middle");

  // Right: everything else, going into the fire. Stack first, flame on top of it.
  o += lbl(700, 440, "EVERYTHING EVER WRITTEN", T.inkDim, 16, "middle");
  for (let i = 0; i < 28; i++) {
    const y = 700 - i * 8, w = 300 - Math.abs(14 - i) * 6;
    o += ln(700 - w / 2, y, 700 + w / 2, y, T.inkFaint, 0.46 - i * 0.011, 2);
  }
  o += `<path d="M624 712 Q656 620 700 664 Q742 552 754 646 Q800 600 776 712 Z" fill="${a}" fill-opacity="0.24" stroke="${a}" stroke-opacity="0.85" stroke-width="2.5"/>`;
  o += lbl(700, 748, "THE KINDLING · 91 TIMES", a, 16, "middle");
  return o;
}

// 08 — Solvei. Two suns, one shadow. One entity, two facings.
function solvei(a) {
  let o = "";
  o += `<circle cx="250" cy="110" r="58" fill="${a}" fill-opacity="0.85"/>`;
  o += `<circle cx="700" cy="126" r="26" fill="${T.danger}" fill-opacity="0.45"/>`;
  o += lbl(250, 194, "PRIMARY", T.inkFaint, 15, "middle");
  o += lbl(700, 176, "COMPANION", T.inkFaint, 15, "middle");
  // one figure, one shadow
  o += `<g transform="translate(430,430)" fill="none" stroke="${T.ink}" stroke-opacity="0.95" stroke-width="3.5" stroke-linecap="round">
    <circle cx="0" cy="-104" r="26"/><path d="M0 -78 V0"/><path d="M-30 -56 H30"/><path d="M0 0 L-24 66 M0 0 L24 66"/></g>`;
  o += `<path d="M454 496 L700 540 L742 520 L470 484 Z" fill="${T.bg0}" fill-opacity="0.85" stroke="${T.inkFaint}" stroke-opacity="0.5" stroke-width="1.5"/>`;
  o += lbl(760, 534, "ONE SHADOW", T.inkDim, 17);
  // the two facings of one thing
  o += ln(60, 596, 940, 596, T.line, 1, 2);
  const shape = (x, filled) => `<g transform="translate(${x},672)">
    <path d="M-52 34 Q-52 -40 0 -40 Q52 -40 52 34 Z" fill="${filled ? a : "none"}" fill-opacity="${filled ? 0.85 : 0}" stroke="${a}" stroke-width="2.5"${filled ? "" : ` stroke-dasharray="6 7"`}/></g>`;
  o += shape(300, true) + shape(700, false);
  o += lbl(300, 738, "HŒL-ÆR", a, 18, "middle");
  o += lbl(700, 738, "HŒL-ÆTH", T.inkFaint, 18, "middle");
  o += `<path d="M360 674 Q500 650 640 674" fill="none" stroke="${T.inkDim}" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="3 8"/>`;
  o += lbl(500, 634, "ONE ENTITY. YOU MOVED.", T.ink, 17, "middle");
  return o;
}

// 09 — the world with no number. The illustration is the absence of one.
function nothing(a) {
  let o = "";
  o += ln(60, 400, 940, 400, T.line, 0.7, 2);
  o += lbl(500, 358, "NO PHENOMENA OUTSTANDING", T.inkFaint, 17, "middle");
  o += `<g transform="translate(500,540) rotate(-9)">
    <rect x="-230" y="-52" width="460" height="104" rx="6" fill="none" stroke="${a}" stroke-opacity="0.75" stroke-width="4"/>
    <text x="0" y="16" text-anchor="middle" font-family="${T.mono}" font-size="46" letter-spacing="7" fill="${a}" fill-opacity="0.8">CONCLUDED</text></g>`;
  o += lbl(500, 664, "611 WORLDS", T.inkDim, 20, "middle");
  o += lbl(500, 694, "ALL OF THEM POPULATED. ALL OF THEM WELL.", T.inkFaint, 15, "middle");
  return o;
}

// 10 — the Directory. Fourteen founders. Eight intervals, two with no length.
function directory(a) {
  let o = "";
  o += `<circle cx="300" cy="290" r="180" fill="none" stroke="${T.line}" stroke-width="3"/>`;
  o += `<circle cx="300" cy="290" r="152" fill="none" stroke="${T.line}" stroke-opacity="0.5" stroke-width="1.5" stroke-dasharray="3 10"/>`;
  for (let i = 0; i < 14; i++) {
    const [x, y] = pol(300, 290, 180, (i / 14) * 2 * P - P / 2);
    const odd = i === 13;
    o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="${odd ? "none" : a}" stroke="${odd ? T.danger : a}" stroke-width="2.5"/>`;
  }
  o += lbl(300, 508, "FOURTEEN SIGNATORIES", T.inkDim, 16, "middle");
  o += lbl(300, 532, "one of them shows only its back", T.danger, 14, "middle");
  // the eight intervals
  const rows = [["FLICK", "NIFHEIM", "1.2 h"], ["TICK", "LIMHEIM", "1 d"], ["MOMENTA", "PURGAHEIM", "50 d"],
                ["CLICK", "HELLHEIM", "2 y"], ["GALAXAL", "—", "456 y"], ["MILGALAXAL", "—", "2455 y"],
                ["ELYSHEIM", "ELYSHEIM", null], ["VÆNHEIM", "VÆNHEIM", null]];
  o += lbl(560, 96, "§3 STANDARD INTERVALS", T.inkDim, 15);
  rows.forEach(([n, realm, len], i) => {
    const y = 130 + i * 62, blank = len === null;
    o += `<rect x="560" y="${y}" width="380" height="48" rx="6" fill="${blank ? "none" : T.panel}" fill-opacity="${blank ? 0 : 0.8}" stroke="${blank ? T.danger : T.line}" stroke-opacity="${blank ? 0.6 : 1}" stroke-width="1.5"${blank ? ` stroke-dasharray="6 6"` : ""}/>`;
    o += lbl(578, y + 31, n, blank ? T.danger : T.ink, 16);
    if (!blank) o += lbl(760, y + 31, realm, T.inkFaint, 14); // blank rows: the realm IS the name
    o += lbl(922, y + 31, blank ? "not yet required" : len, blank ? T.danger : a, 14, "end");
  });
  o += `<rect x="560" y="440" width="380" height="48" rx="6" fill="none" stroke="${T.danger}" stroke-width="2"/>`;
  // the mark: the one name with no sound
  o += ln(140, 600, 140, 700, a, 1, 8);
  o += lbl(176, 640, "THE MARK. NO GLYPH IN THE", T.inkDim, 16);
  o += lbl(176, 664, "DIRECTORY RENDERING STANDARD.", T.inkDim, 16);
  o += lbl(176, 700, "I FILED A REQUEST. I HOPE NOBODY ACTIONS IT.", T.inkFaint, 14);
  return o;
}

// ═══════════════════════════════════════════════════════════════════════════
const ENTRIES = [
  { n: "01", slug: "legend-of-koaeluae-scales", entry: 2245, title: "The Legend Of K'öæluæ's Scales",
    system: "Alpha Axmoiri", pos: "4 of 16", planet: "Exxobar", cat: 3,
    phenom: "Why it snows for a half momenta every click",
    note: "A fire serpent, a water god, and the fisherwoman who talked one of them out of giving up.",
    accent: "#8FD3FF", art: exxobar, glyph: "K'öæluæ" },
  { n: "02", slug: "ninety-nine-names-of-silence", entry: 2250, title: "The Ninety-Nine Names Of Silence",
    system: "Alpha Axmoiri", pos: "7 of 16", planet: "Grïnjdarlay", cat: 3,
    phenom: "Why nobody speaks aloud for a half momenta every click",
    note: "Writing predates speech here by 4,000 clicks. It was invented as a weapon.",
    accent: "#A9B7C6", art: grinjdarlay, glyph: "Uhl" },
  { n: "03", slug: "the-tide-that-owes", entry: 2259, title: "The Tide That Owes",
    system: "Alpha Axmoiri", pos: "16 of 16", planet: "Vædrun", cat: 3,
    phenom: "Why the sea withdraws for nine days every click",
    note: "Nine days borrowed once. The terms were never written down.",
    accent: "#4FC3A1", art: vaedrun, glyph: "Ottokh" },
  { n: "04", slug: "the-word-marltains-do-not-have", entry: 2263, title: "The Word Marltains Do Not Have",
    system: "Brixby", pos: "2 of 11", planet: "Marlt", cat: 3,
    phenom: "Why Marltains speak aloud when alone, and have no word for it",
    note: "Fourteen lines on the sacred list. Thirteen names. One left blank on every copy.",
    accent: "#9B8CFF", art: marlt, glyph: "Hælvren" },
  { n: "05", slug: "the-arm-shake", entry: 2269, title: "The Arm Shake",
    system: "Killuga", pos: "5 of 9", planet: "Killuga Var", cat: 3,
    phenom: "Why Killugans embrace strangers, and hold for a count of eleven",
    note: "Filed by the Directory under Greetings, physical. It is a screening protocol.",
    accent: "#FF8A4C", art: killuga, glyph: "Grin" },
  { n: "06", slug: "the-standing-dead", entry: 2277, title: "The Standing Dead",
    system: "Ymirsgald", pos: "1 of 4", planet: "Jötunheimr", cat: 3,
    phenom: "Why the dead are buried upright, aimed at a fixed celestial bearing",
    note: "The fourteenth is not one of ours. That is why it is on the list.",
    accent: "#5AD1E8", art: jotunheimr, glyph: "Skalde" },
  { n: "07", slug: "the-kindling", entry: 2284, title: "The Kindling",
    system: "Cendrewake", pos: "3 of 7", planet: "Cendre", cat: 3,
    phenom: "Why a civilisation burns its complete written record every ninth generation",
    note: "The monster's body is the archive. It grows by exactly what you record.",
    accent: "#E8A33D", art: cendre, glyph: "Skerrin" },
  { n: "08", slug: "two-suns-one-shadow", entry: 2291, title: "Two Suns, One Shadow",
    system: "Dvær Binary", pos: "6 of 6", planet: "Solvei", cat: 3,
    phenom: "Why two stars cast a single shadow",
    note: "There were never twenty-eight. There were fourteen, each with a front and a back.",
    accent: "#FFB4A2", art: solvei, glyph: "Hœl" },
  { n: "09", slug: "the-world-with-no-number", entry: 2296, title: "The World With No Number",
    system: "[unassigned]", pos: "[none]", planet: "[unnamed]", cat: 3,
    phenom: "None. That is the phenomenon.",
    note: "Forty million people, well and fed, with no gods, no stories, and no word for why.",
    accent: "#6B7684", art: nothing, glyph: "Concluded" },
  { n: "10", slug: "why-we-measure-time-in-hells", entry: 2300, title: "Why We Measure Time In Hells",
    system: "[none]", pos: "[none]", planet: "The Galactic Directory", cat: null,
    phenom: "Why every date in Galactic Standard is named after an afterlife",
    note: "The conversion error is not an error. It is the last surviving measurement of a Concluded world.",
    accent: T.amber, art: directory, glyph: "Done" },
];

const plate = (e) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${W}px;height:${H}px;background:${T.bg0};font-family:${T.sans};overflow:hidden}
  .p{position:relative;width:${W}px;height:${H}px}
  .bg{position:absolute;inset:0}
  .fr{position:absolute;inset:0;z-index:2}
  .c{position:absolute;z-index:3}
  .head{left:76px;right:76px;top:74px;display:flex;align-items:baseline;
    font-family:${T.mono};font-size:19px;letter-spacing:2.6px;color:${T.inkFaint}}
  .head b{color:${e.accent};font-weight:600}
  .head .r{margin-left:auto;color:${T.amber}}
  .ttl{left:76px;right:76px;top:132px}
  .ttl h1{font-size:74px;line-height:1.02;letter-spacing:-2px;color:${T.ink};font-weight:700}
  .ttl .sub{margin-top:22px;font-family:${T.mono};font-size:21px;color:${T.inkDim};letter-spacing:.6px}
  .ttl .sub s{text-decoration:none;color:${e.accent}}
  .art{left:76px;top:${e.n === "09" ? 400 : 356}px;width:1048px;height:734px}
  .foot{left:76px;right:76px;bottom:78px}
  .foot .rule{height:1px;background:rgba(255,255,255,.10);margin-bottom:26px}
  .foot .ph{font-size:29px;line-height:1.34;color:${T.ink};font-weight:600;letter-spacing:-.3px}
  .foot .nt{margin-top:14px;font-size:22px;line-height:1.44;color:${T.inkDim}}
  .foot .bar{margin-top:28px;display:flex;align-items:center;gap:18px;
    font-family:${T.mono};font-size:17px;letter-spacing:1.8px;color:${T.inkFaint}}
  .foot .bar .sg{width:56px;height:56px;opacity:.95}
  .foot .bar .sp{margin-left:auto;color:${e.accent}}
</style></head><body><div class="p">
  <svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs(e.accent)}${ground(W, H)}</svg>
  <svg class="fr" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect x="44" y="44" width="${W - 88}" height="${H - 88}" fill="none" stroke="${T.line}" stroke-width="1.5"/>
    ${plateTicks(44, 44, W - 88, H - 88, e.accent, 34)}
  </svg>
  <div class="c head"><b>GALACTIC DIRECTORY</b>&nbsp;&nbsp;·&nbsp;&nbsp;FIELD PLATE&nbsp;&nbsp;·&nbsp;&nbsp;L. MORKINSTAR
    <span class="r">ENTRY #${e.entry}</span></div>
  <div class="c ttl">
    <h1>${esc(e.title)}</h1>
    <div class="sub"><s>${esc(e.planet)}</s> &nbsp;·&nbsp; ${esc(e.system)} &nbsp;·&nbsp; SERIES ${esc(e.pos)}${e.cat ? " &nbsp;·&nbsp; CATEGORY " + e.cat : ""}</div>
  </div>
  <svg class="c art" viewBox="0 0 1000 760">${e.art(e.accent)}</svg>
  <div class="c foot">
    <div class="rule"></div>
    <div class="ph">${esc(e.phenom)}</div>
    <div class="nt">${esc(e.note)}</div>
    <div class="bar">
      <div class="sg">${sigil(e.glyph, e.accent, { size: 56, stroke: 1.5 })}</div>
      <span>${esc(e.glyph.toUpperCase())}</span>
      <span class="sp">THE MORKINSTAR JOURNALS · ${e.n} / 10</span>
    </div>
  </div>
</div></body></html>`;

const cover = () => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:${T.bg0};font-family:${T.sans};overflow:hidden}
  .p{position:relative;width:1200px;height:630px}
  .bg,.fr{position:absolute;inset:0}.fr{z-index:2}
  .t{position:absolute;z-index:3;left:72px;top:120px;width:660px}
  .t .k{font-family:${T.mono};font-size:18px;letter-spacing:3.4px;color:${T.amber}}
  .t h1{margin-top:20px;font-size:82px;line-height:.99;letter-spacing:-2.6px;color:${T.ink};font-weight:700}
  .t h1 span{color:${T.amber}}
  .t p{margin-top:24px;font-size:23px;line-height:1.42;color:${T.inkDim}}
  .g{position:absolute;z-index:3;right:64px;top:96px;width:400px;height:400px;opacity:.9}
  .f{position:absolute;z-index:3;left:72px;bottom:60px;right:72px;display:flex;
    font-family:${T.mono};font-size:18px;letter-spacing:2px;color:${T.inkFaint}}
  .f .r{margin-left:auto;color:${T.amber}}
</style></head><body><div class="p">
  <svg class="bg" width="1200" height="630" viewBox="0 0 1200 630">${defs(T.amber)}${ground(1200, 630)}</svg>
  <svg class="fr" width="1200" height="630" viewBox="0 0 1200 630">
    <rect x="36" y="36" width="1128" height="558" fill="none" stroke="${T.line}" stroke-width="1.5"/>
    ${plateTicks(36, 36, 1128, 558, T.amber, 30)}</svg>
  <div class="t"><div class="k">TEN ENTRIES · SIX SYSTEMS · ONE HEADCOUNT</div>
    <h1>The Morkinstar<br><span>Journals</span></h1>
    <p>Fourteen gods. Fourteen monsters. Thirteen names.<br>Nobody will tell me the fourteenth.</p></div>
  <div class="g">${sigil("Lu'kifær Morkinstar", T.amber, { size: 400, stroke: 2.2 })}</div>
  <div class="f"><span>GALACTIC DIRECTORY · FIELD SERIES</span><span class="r">#2245 — #2300</span></div>
</div></body></html>`;

// ═══════════════════════════════════════════════════════════════════════════
// SEASON TWO. He stopped filing and started writing, so the plate stops being
// the Directory's survey form and becomes his own page: paper ground, dark ink,
// a case-and-slot frame instead of corner ticks. The two seasons have to be
// distinguishable as OBJECTS from across a room. Same rule for the middle
// though: draw the mechanism, not a mood.
// ═══════════════════════════════════════════════════════════════════════════
const PT = {
  paper0: "#E9DFC9", paper1: "#DED1B4", paper2: "#D2C39F",
  ink: "#1F1A12", inkDim: "#5E5340", inkFaint: "#8E8368",
  line: "#C3B492", red: "#9E3B2E", panel: "#F2EAD8",
  sans: T.sans, mono: T.mono,
};

function paperDefs(accent) {
  return `<defs>
    <linearGradient id="pbg" x1="0" y1="0" x2="0.5" y2="1">
      <stop offset="0" stop-color="${PT.paper0}"/><stop offset="0.6" stop-color="${PT.paper1}"/><stop offset="1" stop-color="${PT.paper2}"/>
    </linearGradient>
    <radialGradient id="pstain" cx="0.82" cy="0.12" r="0.6">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.14"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pvig" cx="0.5" cy="0.5" r="0.76">
      <stop offset="0.6" stop-color="#3A2E18" stop-opacity="0"/><stop offset="1" stop-color="#3A2E18" stop-opacity="0.30"/>
    </radialGradient>
    <filter id="fiber" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <pattern id="rule" width="1200" height="34" patternUnits="userSpaceOnUse">
      <line x1="0" y1="33.5" x2="1200" y2="33.5" stroke="${PT.line}" stroke-opacity="0.42" stroke-width="1"/>
    </pattern>
  </defs>`;
}
const paperGround = (W, H) => `
  <rect width="${W}" height="${H}" fill="url(#pbg)"/>
  <rect x="0" y="300" width="${W}" height="${H - 300}" fill="url(#rule)"/>
  <rect width="${W}" height="${H}" fill="url(#pstain)"/>
  <rect width="${W}" height="${H}" fill="url(#pvig)"/>
  <rect width="${W}" height="${H}" filter="url(#fiber)" opacity="0.10"/>`;

// The case-and-slot frame: a page sitting in one slot of ninety-one.
function slotFrame(x, y, w, h, accent, page) {
  const n = 91, top = y + 26, span = h - 52, step = span / n;
  let o = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${PT.line}" stroke-width="1.5"/>`;
  for (let i = 0; i < n; i++) {
    const yy = top + i * step, filled = i + 1 <= page;
    o += `<line x1="${x - (filled ? 20 : 14)}" y1="${yy.toFixed(1)}" x2="${x - 6}" y2="${yy.toFixed(1)}" stroke="${filled ? accent : PT.inkFaint}" stroke-opacity="${filled ? 0.9 : 0.75}" stroke-width="${filled ? 3 : 1.8}"/>`;
  }
  const mark = top + (page - 1) * step;
  o += `<path d="M${x - 30} ${(mark - 7).toFixed(1)} L${x - 20} ${mark.toFixed(1)} L${x - 30} ${(mark + 7).toFixed(1)} Z" fill="${accent}"/>`;
  return o;
}

const plbl = (x, y, t, c = PT.inkFaint, sz = 17, anchor = "start") =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${PT.mono}" font-size="${sz}" fill="${c}" letter-spacing="1.3">${esc(t)}</text>`;
const pln = (x1, y1, x2, y2, s, o = 1, w = 2) =>
  `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${s}" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;

// P1 — the case. Ninety-one slots, one filled. And two chairs.
function s2case(a) {
  let o = "";
  o += `<rect x="90" y="90" width="560" height="330" rx="6" fill="none" stroke="${PT.ink}" stroke-width="3"/>`;
  o += pln(90, 132, 650, 132, PT.ink, 0.5, 2);
  o += plbl(370, 74, "LID DOES NOT SIT FLUSH", PT.red, 14, "middle");
  for (let i = 0; i < 91; i++) {
    const col = i % 26, row = Math.floor(i / 26);
    const x = 118 + col * 20, y = 176 + row * 62;
    o += pln(x, y, x, y + 48, i === 0 ? a : PT.line, i === 0 ? 1 : 0.55, i === 0 ? 4 : 1.6);
  }
  o += plbl(90, 452, "91 SLOTS. ONE FILLED.", PT.ink, 17);
  o += plbl(90, 478, "no good reason for ninety-one.", PT.inkFaint, 15);
  const chair = (x, fy, solid) => `<g transform="translate(${x},${fy})" fill="none" stroke="${solid ? PT.ink : PT.inkFaint}" stroke-opacity="${solid ? 0.9 : 0.6}" stroke-width="3" stroke-linecap="round"${solid ? "" : ` stroke-dasharray="6 7"`}>
    <path d="M0 0 V-112"/><path d="M0 -56 H70"/><path d="M70 -56 V0"/></g>`;
  o += chair(740, 560, true) + chair(860, 560, false);
  o += pln(710, 560, 950, 560, PT.line, 1, 2);
  o += plbl(830, 600, "THE SECOND CHAIR", PT.ink, 16, "middle");
  o += plbl(830, 624, "he never explained it", PT.inkFaint, 14, "middle");
  o += plbl(90, 560, "MY DEAR READERS:", PT.inkDim, 17);
  o += plbl(90, 590, "certain count, 1", a, 22);
  return o;
}

// P4 — a rain that has never fallen, measured for nine generations.
function s2rain(a) {
  let o = "";
  o += plbl(80, 96, "NINE GENERATIONS OF READINGS", PT.inkDim, 16);
  for (let g = 0; g < 9; g++) {
    const x = 96 + g * 100;
    o += `<rect x="${x}" y="130" width="52" height="200" rx="4" fill="none" stroke="${PT.line}" stroke-width="2"/>`;
    for (let t = 1; t <= 4; t++) o += pln(x, 130 + t * 40, x + 12, 130 + t * 40, PT.line, 0.7, 1.4);
    o += plbl(x + 26, 356, "0", PT.red, 18, "middle");
    o += plbl(x + 26, 380, `g${g + 1}`, PT.inkFaint, 13, "middle");
  }
  o += plbl(80, 424, "EVERY GAUGE. EVERY GENERATION. EMPTY.", PT.red, 17);
  o += `<path d="M80 470 H920" stroke="${PT.line}" stroke-width="2"/>`;
  o += plbl(80, 512, "AND YET:", PT.ink, 18);
  o += plbl(80, 548, "a calendar for it. songs for it. instruments built for it.", PT.inkDim, 16);
  o += plbl(80, 574, "children who ask when it is coming.", PT.inkDim, 16);
  o += plbl(80, 626, "THE ONLY CHILDREN ON VŒRHAN", a, 20);
  o += plbl(80, 654, "WHO STILL ASK WHY.", a, 20);
  o += plbl(80, 712, "nobody checks the provenance of hope.", PT.inkFaint, 15);
  return o;
}

// P9 — four thousand clicks of wrong answers, kept.
function s2coldcase(a) {
  let o = "";
  o += plbl(80, 80, "ALL TWENTY-EIGHT. ONE NIGHT.", PT.ink, 19);
  for (let i = 0; i < 28; i++) {
    const col = i % 14, row = Math.floor(i / 14);
    const x = 84 + col * 62, y = 110 + row * 84;
    o += `<rect x="${x}" y="${y}" width="46" height="60" rx="3" fill="none" stroke="${PT.line}" stroke-width="1.6"/>`;
    o += pln(x + 4, y + 4, x + 42, y + 56, PT.red, 0.75, 2.2);
    o += pln(x + 42, y + 4, x + 4, y + 56, PT.red, 0.75, 2.2);
  }
  o += plbl(80, 300, "GODS", PT.inkFaint, 13);
  o += plbl(80, 300 + 84, "MONSTERS", PT.inkFaint, 13);
  o += `<path d="M80 336 H920" stroke="${PT.line}" stroke-width="2"/>`;
  o += plbl(80, 384, "THEORIES ELIMINATED", PT.inkDim, 16);
  for (let i = 0; i < 240; i++) {
    const x = 84 + (i % 40) * 21, y = 410 + Math.floor(i / 40) * 15;
    o += pln(x, y, x + 13, y, PT.inkFaint, 0.4, 2);
  }
  o += plbl(920, 384, "4,112", a, 30, "end");
  o += plbl(80, 540, "THEY KEEP THE WRONG ANSWERS. THAT IS THE SCRIPTURE.", PT.ink, 17);
  o += `<rect x="80" y="590" width="840" height="96" rx="6" fill="none" stroke="${a}" stroke-width="2.5"/>`;
  o += plbl(500, 630, "DIRECTORY STATUS: OPEN", a, 24, "middle");
  o += plbl(500, 664, "the only one. because they made a question that cannot close.", PT.inkDim, 15, "middle");
  return o;
}

// P16 — the syllabus. Three hundred and forty lessons, and a heading.
function s2syllabus(a) {
  let o = "";
  o += plbl(80, 78, "THE SYLLABUS OF HALLOVAR", PT.inkDim, 16);
  for (let i = 0; i < 340; i++) {
    const col = i % 34, row = Math.floor(i / 34);
    const x = 84 + col * 25, y = 112 + row * 34;
    const late = i > 250, wob = late ? (i % 3) - 1 : 0;
    o += pln(x, y + wob, x + 17, y + wob + (late ? (i % 2 ? 1.5 : -1) : 0), PT.ink, late ? 0.45 : 0.72, 2);
  }
  o += plbl(920, 112, "1", PT.inkFaint, 13, "end");
  o += plbl(920, 452, "340", PT.inkFaint, 13, "end");
  o += plbl(80, 452, "the handwriting gets worse. you can date them by it.", PT.inkFaint, 14);
  o += `<rect x="80" y="500" width="840" height="150" rx="6" fill="${PT.panel}" fill-opacity="0.7" stroke="${a}" stroke-width="3"/>`;
  o += plbl(104, 540, "LESSON 341", a, 18);
  o += plbl(104, 580, "“What To Do When It Goes Wrong", PT.ink, 25);
  o += plbl(104, 614, "And I Am Not Here”", PT.ink, 25);
  o += plbl(896, 540, "( nothing under it )", PT.red, 16, "end");
  o += plbl(80, 690, "HE RAN OUT OF TIME. THEY HAVE BEEN TRYING TO WRITE IT FOR 4,000 CLICKS.", PT.inkDim, 15);
  o += plbl(80, 716, "every attempt is kept. none is authorised.", PT.inkFaint, 15);
  return o;
}

// P23 — the back of what you have said.
function s2unsaid(a) {
  let o = "";
  const fig = (x, y, solid, sc = 1) => `<g transform="translate(${x},${y}) scale(${sc})" fill="none" stroke="${solid ? PT.ink : PT.red}" stroke-opacity="${solid ? 0.92 : 0.55}" stroke-width="3.2" stroke-linecap="round"${solid ? "" : ` stroke-dasharray="7 8"`}>
    <circle cx="0" cy="-108" r="26"/><path d="M0 -82 V-6"/><path d="M-32 -60 H32"/><path d="M0 -6 L-26 62 M0 -6 L26 62"/></g>`;
  o += fig(250, 380, true);
  o += fig(310, 392, false, 1.18);
  o += plbl(250, 440, "SAID", PT.ink, 17, "middle");
  o += plbl(360, 470, "NOT SAID", PT.red, 17, "middle");
  o += plbl(80, 96, "ON THRENN, ONLY THE UNSAID CAN REACH YOU.", PT.ink, 19);
  o += plbl(80, 128, "so they say everything. constantly. out loud. to anyone.", PT.inkDim, 16);
  o += `<path d="M600 300 H930" stroke="${PT.line}" stroke-width="2"/>`;
  o += plbl(600, 274, "SOLVEI, DEEPENED", PT.inkDim, 15);
  o += plbl(600, 344, "what you have not said", PT.ink, 20);
  o += plbl(600, 374, "is the BACK of", PT.inkFaint, 18);
  o += plbl(600, 404, "what you have said.", PT.ink, 20);
  o += plbl(600, 448, "one thing. two facings.", a, 16);
  o += `<path d="M80 560 H920" stroke="${PT.line}" stroke-width="2"/>`;
  o += plbl(80, 606, "THE CORRESPONDENT IS CARRYING SOMETHING.", PT.red, 19);
  o += plbl(80, 640, "he read a name off a child's page on Cendre and told nobody.", PT.inkDim, 16);
  o += plbl(80, 666, "they offered to listen. more than once. kindly.", PT.inkDim, 16);
  o += plbl(80, 714, "HE LEFT. IT LEFT WITH HIM.", PT.red, 21);
  return o;
}

// P30 — the arithmetic that comes out wrong.
function s2weight(a) {
  let o = "";
  const pan = (x, y, w, lbl2, v, red) => {
    let s = `<path d="M${x} ${y} L${x + w} ${y}" stroke="${PT.ink}" stroke-width="3"/>`;
    s += `<path d="M${x + w / 2} ${y} V${y - 54}" stroke="${PT.ink}" stroke-width="2.5"/>`;
    s += `<path d="M${x + 8} ${y} Q${x + w / 2} ${y + 46} ${x + w - 8} ${y}" fill="none" stroke="${PT.ink}" stroke-width="2.5"/>`;
    s += plbl(x + w / 2, y - 70, lbl2, PT.inkDim, 15, "middle");
    s += plbl(x + w / 2, y + 84, v, red ? PT.red : PT.ink, 24, "middle");
    return s;
  };
  o += pan(110, 250, 240, "CASE + PAGES", "8.4412", true);
  o += plbl(500, 262, "≠", PT.red, 46, "middle");
  o += pan(650, 250, 240, "CASE, THEN PAGES", "8.4407", false);
  o += plbl(500, 330, "difference: 0.0005", PT.red, 17, "middle");
  o += plbl(500, 356, "( instrument error is 0.0004 )", PT.inkFaint, 15, "middle");
  o += `<path d="M80 420 H920" stroke="${PT.line}" stroke-width="2"/>`;
  o += plbl(80, 462, "FOUR MEASUREMENTS", PT.inkDim, 16);
  const rows = [["day 1", "0.0005"], ["day 5", "0.0006"], ["momenta 1", "0.0009"], ["momenta 2", "0.0014"]];
  rows.forEach(([d, v], i) => {
    const y = 502 + i * 40;
    o += plbl(104, y, d, PT.inkFaint, 16);
    o += plbl(340, y, v, i === 3 ? PT.red : PT.ink, 18, "end");
    o += `<rect x="380" y="${y - 15}" width="${Number(v) * 340000}" height="18" fill="${a}" fill-opacity="${0.3 + i * 0.14}"/>`;
  });
  o += plbl(80, 690, "I AM RECORDING MEASUREMENTS. I AM NOT RECORDING CONCLUSIONS.", PT.ink, 17);
  o += plbl(80, 718, "nobody has ever weighed an archive. convenient, that.", PT.inkFaint, 15);
  return o;
}

// P38 — six fences, aimed at each other.
function s2fences(a) {
  let o = "";
  const W2 = [
    { n: "JÖTUNHEIMR", x: 200, y: 180, t: 1 }, { n: "VÆDRUN", x: 730, y: 250, t: 0 },
    { n: "HESKALD", x: 850, y: 520, t: 3 }, { n: "ORRIN", x: 540, y: 640, t: 2 },
    { n: "TAL-VEY", x: 180, y: 560, t: 5 }, { n: "MUNNAR", x: 430, y: 350, t: 4 },
  ];
  W2.forEach((w, i) => {
    const tgt = W2[w.t];
    const dx = tgt.x - w.x, dy = tgt.y - w.y, L = Math.hypot(dx, dy);
    const ux = dx / L, uy = dy / L;
    o += `<line x1="${w.x + ux * 34}" y1="${w.y + uy * 34}" x2="${(w.x + ux * (L - 40)).toFixed(1)}" y2="${(w.y + uy * (L - 40)).toFixed(1)}" stroke="${a}" stroke-opacity="0.55" stroke-width="2" stroke-dasharray="7 6"/>`;
    const hx = w.x + ux * (L - 40), hy = w.y + uy * (L - 40);
    o += `<path d="M${(hx).toFixed(1)} ${(hy).toFixed(1)} L${(hx - ux * 16 - uy * 7).toFixed(1)} ${(hy - uy * 16 + ux * 7).toFixed(1)} L${(hx - ux * 16 + uy * 7).toFixed(1)} ${(hy - uy * 16 - ux * 7).toFixed(1)} Z" fill="${a}"/>`;
  });
  W2.forEach(w => {
    o += `<circle cx="${w.x}" cy="${w.y}" r="28" fill="${PT.paper0}" stroke="${PT.ink}" stroke-width="2.5"/>`;
    for (let k = 0; k < 9; k++) o += pln(w.x - 16 + k * 4, w.y + 12, w.x - 16 + k * 4, w.y + 22, PT.ink, 0.6, 1.6);
    o += plbl(w.x, w.y - 40, w.n, PT.ink, 14, "middle");
  });
  o += plbl(80, 76, "AS DIRECTIONS: NO AGREEMENT. ( TRUE, AND INCOMPLETE )", PT.inkFaint, 16);
  o += plbl(80, 726, "AS LINES FROM WHERE EACH ONE STANDS: THEY MEET.", PT.ink, 19);
  o += plbl(920, 726, "SIX FENCES", a, 19, "end");
  return o;
}

// P47 — a calendar kept wrong on purpose, and the wall that pays for it.
function s2calendar(a) {
  let o = "";
  o += plbl(80, 82, "THE CALENDAR OF KAUNIS", PT.inkDim, 16);
  for (let i = 0; i < 60; i++) {
    const x = 84 + (i % 15) * 42, y = 116 + Math.floor(i / 15) * 46;
    o += `<rect x="${x}" y="${y}" width="32" height="34" fill="none" stroke="${PT.line}" stroke-width="1.4"/>`;
  }
  const dx = 84 + 9 * 42, dy = 116 + 2 * 46;
  o += `<rect x="${dx}" y="${dy}" width="32" height="34" fill="${PT.red}" fill-opacity="0.22" stroke="${PT.red}" stroke-width="2.5"/>`;
  o += plbl(dx + 16, dy + 62, "↑", PT.red, 20, "middle");
  o += plbl(dx + 16, dy + 86, "the error", PT.red, 14, "middle");
  o += plbl(80, 366, "INTRODUCED ON PURPOSE. FORBIDDEN TO CORRECT.", PT.ink, 17);
  o += plbl(80, 394, "you may inherit the method. you may not inherit the answer.", PT.inkDim, 15);
  o += `<path d="M80 440 H920" stroke="${PT.line}" stroke-width="2"/>`;
  o += `<rect x="80" y="482" width="840" height="192" rx="4" fill="none" stroke="${PT.ink}" stroke-width="3"/>`;
  o += plbl(500, 522, "THE WALL", PT.inkDim, 15, "middle");
  o += plbl(500, 588, "41,206", PT.red, 52, "middle");
  o += plbl(500, 626, "WRONG PLANTING DATES. UPDATED EVERY GENERATION.", PT.inkDim, 15, "middle");
  o += plbl(500, 654, "they carved it themselves. they think it is worth it.", PT.inkFaint, 14, "middle");
  o += plbl(80, 722, "AND ON MY OWN WALL: nothing yet.", a, 17);
  return o;
}

// P58 — a hand that is not his.
function s2corrected(a) {
  let o = "";
  o += plbl(80, 80, "PAGE 30, AS I LEFT IT", PT.inkDim, 16);
  const rows = [["day 1", "0.0005", "0.00051"], ["day 5", "0.0006", "0.00058"], ["momenta 1", "0.0009", "0.00094"], ["momenta 2", "0.0014", "0.00139"]];
  rows.forEach(([d, mine, fixed], i) => {
    const y = 132 + i * 56;
    o += plbl(104, y, d, PT.inkFaint, 17);
    o += plbl(400, y, mine, PT.ink, 20, "end");
    o += pln(300, y - 7, 410, y - 7, PT.red, 0.8, 2);
    o += plbl(470, y - 12, fixed, PT.red, 21);
    o += plbl(700, y, "✓ correct", PT.red, 15);
  });
  o += plbl(470, 106, "in a hand that is not mine", PT.red, 15);
  o += `<path d="M80 396 H920" stroke="${PT.line}" stroke-width="2"/>`;
  o += plbl(80, 440, "THE CASE HAS BEEN ON MY SHIP. UNLOCKED. NOBODY ABOARD.", PT.ink, 17);
  o += plbl(80, 470, "Ossul is nine decks down on a ring I have not visited.", PT.inkDim, 15);
  o += plbl(80, 522, "SKERRIN HAS NO BODY.", PT.red, 24);
  o += plbl(80, 556, "ITS MASS IS THE RECORD.", PT.red, 24);
  o += plbl(80, 590, "IT GROWS BY EXACTLY WHAT YOU WRITE DOWN.", PT.red, 24);
  o += plbl(80, 626, "( I transcribed that sentence myself. Entry #2284. )", PT.inkFaint, 15);
  o += `<rect x="80" y="656" width="840" height="76" rx="5" fill="none" stroke="${a}" stroke-width="2.5"/>`;
  o += plbl(500, 690, "58 PAGES. ALL OF THEM MINE.", a, 22, "middle");
  o += plbl(500, 718, "an archive of one author is not an archive. it is a self-portrait.", PT.inkDim, 14, "middle");
  return o;
}

// P91 — the last page, eighty-one early. And an interval that now has a length.
function s2backofcase(a) {
  let o = "";
  o += `<rect x="80" y="80" width="560" height="300" rx="6" fill="none" stroke="${PT.ink}" stroke-width="3"/>`;
  for (let i = 0; i < 91; i++) {
    const col = i % 26, row = Math.floor(i / 26);
    const x = 108 + col * 20, y = 116 + row * 62;
    const filled = i < 10, last = i === 90;
    o += pln(x, y, x, y + 48, last ? PT.red : filled ? a : PT.line, last ? 1 : filled ? 0.85 : 0.4, last ? 4.5 : filled ? 3 : 1.4);
  }
  o += plbl(80, 412, "TEN WRITTEN. EIGHTY-ONE BLANK. ONE AT THE BACK.", PT.ink, 17);
  o += plbl(80, 440, "so the last word in it is one I chose while I was still choosing.", PT.inkFaint, 15);
  o += `<rect x="690" y="130" width="230" height="200" rx="5" fill="${PT.panel}" fill-opacity="0.8" stroke="${PT.red}" stroke-width="3"/>`;
  o += plbl(805, 232, "████", PT.red, 34, "middle");
  o += plbl(805, 272, "THE NAME", PT.red, 15, "middle");
  o += plbl(805, 300, "written on purpose", PT.inkFaint, 13, "middle");
  o += `<path d="M80 476 H920" stroke="${PT.line}" stroke-width="2"/>`;
  o += plbl(80, 512, "§3 STANDARD INTERVALS", PT.inkDim, 15);
  const iv = [["CLICK", "HELLHEIM", "2 y"], ["GALAXAL", "—", "456 y"], ["ELYSHEIM", "ELYSHEIM", "not yet required"], ["VÆNHEIM", "VÆNHEIM", "ASSIGNED"]];
  iv.forEach(([n, r, v], i) => {
    const y = 534 + i * 46, hot = n === "VÆNHEIM";
    o += `<rect x="80" y="${y}" width="840" height="36" rx="4" fill="${hot ? PT.red : "none"}" fill-opacity="${hot ? 0.14 : 0}" stroke="${hot ? PT.red : PT.line}" stroke-width="${hot ? 2.5 : 1.2}"/>`;
    o += plbl(100, y + 25, n, hot ? PT.red : PT.ink, 16);
    o += plbl(420, y + 25, r, PT.inkFaint, 14);
    o += plbl(900, y + 25, v, hot ? PT.red : PT.inkDim, 15, "end");
  });
  o += plbl(80, 748, "SOMETHING HAS NOW LASTED LONG ENOUGH TO NEED IT.", PT.red, 18);
  return o;
}

const S2 = [
  { n: "01", p: 1, slug: "the-second-chair", title: "The Second Chair", where: "The case", concluded: 613,
    phenom: "He builds the case, and has no good reason for ninety-one",
    note: "The only reader he is certain of is one clerk, nine decks down, who has a second chair.",
    accent: "#8A6A2F", art: s2case, glyph: "The Case" },
  { n: "02", p: 4, slug: "the-weather-they-made-up", title: "The Weather They Made Up", where: "Vœrhan", concluded: 617,
    phenom: "A rain that has never fallen, measured for nine generations",
    note: "A fabricated myth works exactly as well as a true one. Nobody checks the provenance of hope.",
    accent: "#3F6E64", art: s2rain, glyph: "Emmerin" },
  { n: "03", p: 9, slug: "the-cold-case-of-all-fourteen", title: "The Cold Case Of All Fourteen", where: "Dhurin", concluded: 619,
    phenom: "All twenty-eight died in one night, four thousand clicks ago",
    note: "Their priests are detectives and their scripture is a library of wrong answers.",
    accent: "#7A3E2E", art: s2coldcase, glyph: "The Kest" },
  { n: "04", p: 16, slug: "the-last-thing-he-taught-them", title: "The Last Thing He Taught Them", where: "Ilmarrow", concluded: 624,
    phenom: "A god who announced his end date and spent it teaching",
    note: "Lesson 341 is a title with nothing under it. They have been trying to write it for four thousand clicks.",
    accent: "#8A5A28", art: s2syllabus, glyph: "Hallovar" },
  { n: "05", p: 23, slug: "what-you-have-not-said-out-loud", title: "What You Have Not Said Out Loud", where: "Threnn", concluded: 631,
    phenom: "Only the unsaid can harm you",
    note: "They offered to listen. More than once. Kindly. He left, and it left with him.",
    accent: "#5B4A7A", art: s2unsaid, glyph: "The Ovai" },
  { n: "06", p: 30, slug: "the-weight-of-the-case", title: "The Weight Of The Case", where: "His ship", concluded: 640,
    phenom: "The case weighs more than the case plus the pages",
    note: "I am recording measurements. I am not recording conclusions.",
    accent: "#6B5B3A", art: s2weight, glyph: "The Weight" },
  { n: "07", p: 38, slug: "six-worlds-six-fences", title: "Six Worlds, Six Fences", where: "Six worlds", concluded: 651,
    phenom: "Why six fixed bearings do not agree",
    note: "They do not agree because they are aimed at each other. Neither world knows.",
    accent: "#2E5A7A", art: s2fences, glyph: "The Bearing" },
  { n: "08", p: 47, slug: "the-one-that-stayed-open", title: "The One That Stayed Open", where: "Kaunis", concluded: 659,
    phenom: "A calendar kept deliberately wrong, forever",
    note: "You may inherit the method. You may not inherit the answer. The wall says what it costs.",
    accent: "#3F6E3A", art: s2calendar, glyph: "The Vedrei" },
  { n: "09", p: 58, slug: "someone-has-been-reading", title: "Someone Has Been Reading", where: "His ship", concluded: 663,
    phenom: "The measurements have been corrected in a hand that is not his",
    note: "An archive of one author is not an archive. It is a self-portrait. And he does not stop.",
    accent: "#9E3B2E", art: s2corrected, glyph: "Skerrin" },
  { n: "10", p: 91, slug: "the-back-of-the-case", title: "The Back Of The Case", where: "The case", concluded: 671,
    phenom: "He writes the last page eighty-one pages early",
    note: "Vænheim has a number now. Something has lasted long enough to need it.",
    accent: "#9E3B2E", art: s2backofcase, glyph: "Vænheim" },
];

const paperPlate = (e) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${W}px;height:${H}px;background:${PT.paper1};font-family:${PT.sans};overflow:hidden}
  .p{position:relative;width:${W}px;height:${H}px}
  .bg{position:absolute;inset:0}.fr{position:absolute;inset:0;z-index:2}
  .c{position:absolute;z-index:3}
  .head{left:112px;right:76px;top:74px;display:flex;align-items:baseline;
    font-family:${PT.mono};font-size:19px;letter-spacing:2.6px;color:${PT.inkFaint}}
  .head b{color:${e.accent};font-weight:600}
  .head .r{margin-left:auto;color:${PT.inkDim}}
  .ttl{left:112px;right:76px;top:132px}
  .ttl h1{font-size:72px;line-height:1.03;letter-spacing:-1.8px;color:${PT.ink};font-weight:700}
  .ttl .sub{margin-top:20px;font-family:${PT.mono};font-size:21px;color:${PT.inkDim};letter-spacing:.5px}
  .ttl .sub s{text-decoration:none;color:${e.accent};font-weight:600}
  .art{left:112px;top:360px;width:1012px;height:734px}
  .foot{left:112px;right:76px;bottom:78px}
  .foot .rule{height:1.5px;background:${PT.line};margin-bottom:24px}
  .foot .ph{font-size:29px;line-height:1.32;color:${PT.ink};font-weight:600;letter-spacing:-.3px}
  .foot .nt{margin-top:14px;font-size:22px;line-height:1.42;color:${PT.inkDim}}
  .foot .bar{margin-top:26px;display:flex;align-items:center;gap:18px;
    font-family:${PT.mono};font-size:17px;letter-spacing:1.7px;color:${PT.inkFaint}}
  .foot .bar .sp{margin-left:auto;color:${e.accent}}
</style></head><body><div class="p">
  <svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${paperDefs(e.accent)}${paperGround(W, H)}</svg>
  <svg class="fr" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${slotFrame(76, 44, W - 152, H - 88, e.accent, e.p)}</svg>
  <div class="c head"><b>PAGE ${e.p} OF 91</b>&nbsp;&nbsp;·&nbsp;&nbsp;NOT FILED&nbsp;&nbsp;·&nbsp;&nbsp;L. MORKINSTAR
    <span class="r">CONCLUDED: ${e.concluded}</span></div>
  <div class="c ttl">
    <h1>${esc(e.title)}</h1>
    <div class="sub"><s>${esc(e.where)}</s> &nbsp;·&nbsp; THE NINETY-ONE PAGES &nbsp;·&nbsp; SEASON TWO</div>
  </div>
  <svg class="c art" viewBox="0 0 1000 760">${e.art(e.accent)}</svg>
  <div class="c foot">
    <div class="rule"></div>
    <div class="ph">${esc(e.phenom)}</div>
    <div class="nt">${esc(e.note)}</div>
    <div class="bar"><span>${esc(e.glyph.toUpperCase())}</span>
      <span class="sp">THE MORKINSTAR JOURNALS · S2 · ${e.n} / 10</span></div>
  </div>
</div></body></html>`;

// ── render ──────────────────────────────────────────────────────────────────
const only = process.argv[2];
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

mkdirSync(resolve(OUT, "web"), { recursive: true });

async function shoot(html, w, h, file) {
  const tab = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await tab.setContent(html, { waitUntil: "load" });
  writeFileSync(resolve(OUT, file), await tab.screenshot({ type: "png" }));
  await tab.close();
  // Web copy for the site: same page at half scale as JPEG. deviceScaleFactor does the
  // resampling, so this needs no image library and stays byte-identical in layout.
  const wtab = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 0.5 });
  await wtab.setContent(html, { waitUntil: "load" });
  writeFileSync(resolve(OUT, "web", file.replace(/\.png$/, ".jpg")),
    await wtab.screenshot({ type: "jpeg", quality: 74 }));
  await wtab.close();
  console.log(`  ${file}  (${w}x${h})  +web`);
}

// arg forms:  (none) = everything · "07" = S1 plate 07 · "s2" = all S2 · "s2-04" = one S2 plate
const s2Only = only && only.startsWith("s2");
const s2Pick = s2Only && only.includes("-") ? only.split("-")[1] : null;

if (!only) await shoot(cover(), 1200, 630, "00-series-cover.png");
if (!s2Only) {
  for (const e of ENTRIES) {
    if (only && only !== e.n) continue;
    await shoot(plate(e), W, H, `s1-${e.n}-${e.slug}.png`);
  }
}
if (!only || s2Only) {
  for (const e of S2) {
    if (s2Pick && s2Pick !== e.n) continue;
    await shoot(paperPlate(e), W, H, `s2-${e.n}-${e.slug}.png`);
  }
}
await browser.close();
console.log("done.");
