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
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
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
// `paint-order: stroke` draws the stroke UNDER the fill, so a stroke in the
// plate's own ground colour becomes a halo that separates the word from
// whatever it lies over without outlining it. This is here rather than at the
// call sites because the tellers are now composited at full size behind the
// mechanisms, so any label can end up over linework — moving the ten labels
// that collide today would just move the problem to the next re-layout.
const halo = (ground, w = 3.5) =>
  `stroke="${ground}" stroke-width="${w}" stroke-linejoin="round" paint-order="stroke" stroke-opacity="1"`;
const lbl = (x, y, t, c = T.inkFaint, sz = 17, anchor = "start") =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${T.mono}" font-size="${sz}" fill="${c}" letter-spacing="1.4" ${halo(T.bg1)}>${esc(t)}</text>`;

// 01. Exxobar. A serpent coil torn down the middle; the residue falls as snow.
function exxobar(a) {
  let o = witness("feeriko", "Feeriko", 560, 400, 620, traceInk(a), 0.5, (x, y, t) => lbl(x, y, t, T.inkDim, 13, "start"));
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

// 02. Grïnjdarlay. Ninety-nine names, ninety-eight eaten, one held.
function grinjdarlay(a) {
  let o = witness("tveggi", "Tveggi", 500, 400, 640, traceInk(a), 0.5, (x, y, t) => lbl(x, y, t, T.inkDim, 13, "start")), cx = 500, cy = 300, r = 210;
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

// 03. Vædrun. Nine days of tide, borrowed once, collected forever.
function vaedrun(a) {
  let o = witness("soebra", "Sœbra", 500, 415, 620, traceInk(a), 0.48, (x, y, t) => lbl(x, y, t, T.inkDim, 13, "start"));
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

// 04. Marlt. Two chairs. One occupied. The list with a blank line.
function marlt(a) {
  let o = witness("soelvi", "Sœlvi", 430, 390, 600, traceInk(a), 0.5, (x, y, t) => lbl(x, y, t, T.inkDim, 13, "start"));
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

// 05. Killuga Var. The eleven count. A test, still running.
function killuga(a) {
  let o = witness("aedri", "Ædri", 500, 405, 640, traceInk(a), 0.48, (x, y, t) => lbl(x, y, t, T.inkDim, 13, "start"));
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

// 06. Jötunheimr. Four billion graves, each surveyed, all aimed at empty sky.
function jotunheimr(a) {
  let o = witness("hild-ronn", "Hild-Ronn", 480, 400, 660, traceInk(a), 0.46, (x, y, t) => lbl(x, y, t, T.inkDim, 13, "start"));
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

// 07. Cendre. Burn everything. Keep one page. A child writes it.
function cendre(a) {
  let o = witness("the-cendran-child", "The Cendran Child", 470, 415, 640, traceInk(a), 0.46, (x, y, t) => lbl(x, y, t, T.inkDim, 13, "start"));
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

// 08. Solvei. Two suns, one shadow. One entity, two facings.
function solvei(a) {
  let o = witness("ilta", "Ilta", 500, 410, 640, traceInk(a), 0.48, (x, y, t) => lbl(x, y, t, T.inkDim, 13, "start"));
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

// 09. the world with no number. The illustration is the absence of one.
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

// 10. the Directory. Fourteen founders. Eight intervals, two with no length.
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
// THE MEDIUM. Season 1 was broadcast. Season 2 was never sent — so it gets no
// equivalent chrome anywhere below, and that bare absence is the point, not
// an oversight. Season 3's fire is its own medium already and is untouched.
// ═══════════════════════════════════════════════════════════════════════════

// Faint horizontal relay banding across the ground: the receiving end's noise
// floor. Restrained well below the grain texture already on every plate, so
// it reads as chrome, not damage, and never competes with a label.
function relayBand(W, H) {
  let o = "";
  for (let y = 0; y < H; y += 16) {
    const strong = (y / 16) % 9 === 0;
    o += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${T.inkDim}" stroke-opacity="${strong ? 0.05 : 0.022}" stroke-width="1"/>`;
  }
  return o;
}

// The signal figure in the header relay strip. Not meaningful telemetry, just
// a received-state that varies plate to plate the way a real one would.
const relaySignal = (entry) => (95 + (entry % 5)).toFixed(1);

// The rig's fingerprints: the Directory's own rendering-status stamp, in its
// own dry institutional voice. RESOLVED is the default and covers most of the
// season. Strained or failed language appears ONLY where canon itself says
// the record does not close cleanly — restraint is the rule, not the joke.
const RENDER_STATUS = {
  "07": { text: "FIELD 14 WITHHELD, NOT MISSING", strained: true },   // Cendre: the name is present. Withheld is not the same as missing.
  "04": { text: "FIELD 14 WILL NOT RESOLVE", strained: true },        // Marlt: blank on every copy. Not an omission, a property of the list.
  "09": { text: "RESOLVED — SURVEY COMPLETE, NOTHING OUTSTANDING", strained: false }, // the world with no number: leaning into the emptiness, not damage.
  "10": { text: "SELF-SUBJECT. NOT NEUTRAL.", strained: true },       // the Directory rendering itself: the one thing it cannot do neutrally.
};
const renderStatus = (n) => RENDER_STATUS[n] ?? { text: "RESOLVED", strained: false };

// Tveggi's mark (assets/mark.svg): the vertical scratch that stands in for a
// name with no sound, and the object that made writing possible at all. A
// tiny, constant registration mark in the same corner of every plate across
// all three seasons, quiet and consistent, the way a printer's mark sits on
// a plate — it is on every written thing here for the same reason written
// things exist.
const regMark = (color, opacity = 0.5) =>
  `<line x1="1100" y1="48" x2="1100" y2="70" stroke="${color}" stroke-opacity="${opacity}" stroke-width="3.5" stroke-linecap="round"/>`;

// ═══════════════════════════════════════════════════════════════════════════
// THE RENDERING. species.md's doctrine: a plate is not a diagram, it is the
// Directory's rendering of a world, and a rendering is the mechanism AND the
// mark AND the person. Two things follow.
//
// (1) The teller goes INTO the plate. Ten worlds have a drawn witness
// (fiction/morkinstar-journals/assets/witnesses/<id>.png) who is currently
// visible nowhere but a separate page. witness() composites the real portrait
// small, at the scale of the phenomenon it belongs to, knocked back under the
// mechanism by a duotone filter tinted toward the plate's own ground — an
// invert on S1's dark plates, a gentle re-tint on S2's paper ones — captioned
// in the plate's own label style.
//
// (2) The sigil goes INTO the plate, not just the footer chip. sigilWatermark
// drops a large, very faint copy of the entity's own hashed mark behind the
// mechanism, because the mark of the thing an entry is about belongs in its
// own rendering.
const WITNESS_DIR = resolve(ROOT, "fiction/morkinstar-journals/assets/witnesses");
const witnessCache = new Map();
function witnessUri(id) {
  if (!witnessCache.has(id)) {
    const buf = readFileSync(resolve(WITNESS_DIR, `${id}.png`));
    witnessCache.set(id, `data:image/png;base64,${buf.toString("base64")}`);
  }
  return witnessCache.get(id);
}
const rgb01 = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
// Season One's tellers arrive as instrument traces on a dark survey form, so
// they want to read cool and luminous rather than in the entry's accent —
// a saturated amber or red line drawing at this size turns into decoration.
// A breath of the accent keeps each plate tied to its entry without the
// rendering pretending to be a colour illustration.
const mixHex = (a, b, t) => {
  const [ar, ag, ab] = rgb01(a), [br, bg, bb] = rgb01(b);
  const c = (x, y) => Math.round((x + (y - x) * t) * 255).toString(16).padStart(2, "0");
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
};
const traceInk = (accent) => mixHex(T.ink, accent, 0.26);
// Cut the drawing off its paper, and keep only the ink.
//
// The portraits are ink on aged, foxed, unevenly lit paper. Every previous
// attempt treated that paper as something to disguise — duotone it into the
// plate's ground, then feather the edges — and both failed the same way,
// because a rectangle of the wrong tone is still a rectangle. Duotone gave a
// hard-edged card; feathering gave a smudge. Neither is a portrait.
//
// This removes the paper instead. Blurring the greyscale heavily gives a
// LOCAL estimate of the paper tone at every pixel, which is the standard
// flat-field correction and is the part that matters: a global threshold
// cannot separate ink from a sheet whose corners are darker than the middle,
// which is why the measured ink coverage of these scans came out at 20-45%
// when real linework is nearer 8%. Subtract the local paper from the image
// and what is left is ink density alone. Push that into the ALPHA channel and
// paint the RGB a flat `ink` colour, and the drawing arrives with its own
// silhouette as its edge. There is no ground to hide and no rectangle to
// feather, so the mask this used to need is gone.
//
// `w` is needed because SVG filters work in user space: the source is 1408px
// wide drawn at `w` units, so the blur radius has to be scaled or the paper
// estimate is wrong by whatever the layout happens to be.
const WITNESS_BLUR = 60;   // in SOURCE pixels, at the portraits' native 1408 width
const WITNESS_RANGE = 0.46; // paper-to-ink luminance span that maps to full opacity
function witnessFilter(id, ink, w) {
  const [ir, ig, ib] = rgb01(ink);
  const sd = (WITNESS_BLUR * w / 1408).toFixed(3);
  return `<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" in="SourceGraphic" result="grey"
      values="0.30 0.59 0.11 0 0  0.30 0.59 0.11 0 0  0.30 0.59 0.11 0 0  0 0 0 1 0"/>
    <feGaussianBlur in="grey" stdDeviation="${sd}" result="paper"/>
    <feComponentTransfer in="grey" result="invgrey">
      <feFuncR type="table" tableValues="1 0"/>
      <feFuncG type="table" tableValues="1 0"/>
      <feFuncB type="table" tableValues="1 0"/>
    </feComponentTransfer>
    <!-- density = paper - grey, written as paper + (1-grey) - 1 on purpose.
         feComposite arithmetic runs on the ALPHA channel too, so the direct
         form gives alpha = 1 - 1 = 0 across the whole interior: the drawing
         vanished and only the blurred boundary survived, as a pale frame.
         Adding an inverted input instead leaves alpha = 1 + 1 - 1 = 1 inside
         the image and negative (so clamped transparent) outside it. -->
    <feComposite in="paper" in2="invgrey" operator="arithmetic" k1="0" k2="1" k3="1" k4="-1" result="density"/>
    <feComponentTransfer in="density" result="norm">
      <feFuncR type="linear" slope="${(1 / WITNESS_RANGE).toFixed(3)}"/>
      <feFuncG type="linear" slope="${(1 / WITNESS_RANGE).toFixed(3)}"/>
      <feFuncB type="linear" slope="${(1 / WITNESS_RANGE).toFixed(3)}"/>
    </feComponentTransfer>
    <feComponentTransfer in="norm" result="shaped">
      <feFuncR type="gamma" amplitude="1" exponent="0.92"/>
      <feFuncG type="gamma" amplitude="1" exponent="0.92"/>
      <feFuncB type="gamma" amplitude="1" exponent="0.92"/>
    </feComponentTransfer>
    <feColorMatrix in="shaped" type="matrix"
      values="0 0 0 0 ${ir.toFixed(3)}  0 0 0 0 ${ig.toFixed(3)}  0 0 0 0 ${ib.toFixed(3)}  1 0 0 0 0"/>
  </filter>`;
}
// One teller, composited small under the mechanism and captioned. cx/cy/w sit
// in the illustration's own 1000x760 box; h follows the portraits' fixed
// 1408x768 ratio. `label` is the plate's own lbl()/plbl() so the caption
// reads as part of the same rendering, not a sticker on top of it.
function witness(id, name, cx, cy, w, ink, opacity, label) {
  const h = w * (768 / 1408), x = cx - w / 2, y = cy - h / 2, fid = `wf-${id}`;
  // The caption goes in the illustration box's top-left, not under the image.
  // The teller is now drawn FIRST so the mechanism can sit over them, and a
  // caption centred beneath a 640-wide figure lands wherever that plate
  // happens to draw next — on s1-02 the eye's opaque fill painted straight
  // over it and the teller's name simply was not on the plate. Top-left is
  // the one region every mechanism leaves clear, and it reads as a field on
  // the form, which is what the Directory would have put there anyway.
  return `<defs>${witnessFilter(fid, ink, w)}</defs>` +
    `<image href="${witnessUri(id)}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" opacity="${opacity}" filter="url(#${fid})"/>` +
    label(26, 32, `TELLER · ${name.toUpperCase()}`);
}
// A large, near-invisible copy of the entity's own sigil, centred on or near
// the mechanism it belongs to, sitting behind everything the illustration
// draws (callers place it before the illustration's own markup).
function sigilWatermark(glyph, accent, cx, cy, size, opacity = 0.1) {
  return `<svg x="${(cx - size / 2).toFixed(1)}" y="${(cy - size / 2).toFixed(1)}" width="${size}" height="${size}" opacity="${opacity}">${sigil(glyph, accent, { size, stroke: 1.6 })}</svg>`;
}

// ═══════════════════════════════════════════════════════════════════════════
const ENTRIES = [
  { n: "01", slug: "legend-of-koaeluae-scales", entry: 2245, title: "The Legend Of K'öæluæ's Scales",
    system: "Alpha Axmoiri", pos: "4 of 16", planet: "Exxobar", cat: 3,
    phenom: "Why it snows for a half momenta every click",
    note: "A fire serpent, a water god, and the fisherwoman who talked one of them out of giving up.",
    accent: "#8FD3FF", art: exxobar, glyph: "K'öæluæ", wm: [280, 240, 420] },
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
    accent: "#6B7684", art: nothing, glyph: "Concluded", wm: [500, 540, 380] },
  { n: "10", slug: "why-we-measure-time-in-hells", entry: 2300, title: "Why We Measure Time In Hells",
    system: "[none]", pos: "[none]", planet: "The Galactic Directory", cat: null,
    phenom: "Why every date in Galactic Standard is named after an afterlife",
    note: "The conversion error is not an error. It is the last surviving measurement of a Concluded world.",
    accent: T.amber, art: directory, glyph: "Done", wm: [300, 300, 420] },
];

const plate = (e) => { const rs = renderStatus(e.n), artBottom = (e.n === "09" ? 400 : 356) + 734; return `<!doctype html><html><head><meta charset="utf-8"><style>
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
  .relay{left:76px;right:76px;top:105px;font-family:${T.mono};font-size:13px;letter-spacing:2px;color:${T.inkFaint};opacity:.72}
  .relay b{color:${T.amber};font-weight:600}
  .ttl{left:76px;right:76px;top:132px}
  .ttl h1{font-size:74px;line-height:1.02;letter-spacing:-2px;color:${T.ink};font-weight:700}
  .ttl .sub{margin-top:22px;font-family:${T.mono};font-size:21px;color:${T.inkDim};letter-spacing:.6px}
  .ttl .sub s{text-decoration:none;color:${e.accent}}
  .art{left:76px;top:${e.n === "09" ? 400 : 356}px;width:1048px;height:734px}
  .rstat{right:76px;top:${artBottom + 26}px;font-family:${T.mono};font-size:14px;letter-spacing:1.4px;
    text-align:right;color:${rs.strained ? T.danger : T.inkFaint};opacity:.85}
  .foot{left:76px;right:76px;bottom:78px}
  .foot .rule{height:1px;background:rgba(255,255,255,.10);margin-bottom:26px}
  .foot .ph{font-size:29px;line-height:1.34;color:${T.ink};font-weight:600;letter-spacing:-.3px}
  .foot .nt{margin-top:14px;font-size:22px;line-height:1.44;color:${T.inkDim}}
  .foot .bar{margin-top:28px;display:flex;align-items:center;gap:18px;
    font-family:${T.mono};font-size:17px;letter-spacing:1.8px;color:${T.inkFaint}}
  .foot .bar .sg{width:56px;height:56px;opacity:.95}
  .foot .bar .sp{margin-left:auto;color:${e.accent}}
</style></head><body><div class="p">
  <svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs(e.accent)}${ground(W, H)}${relayBand(W, H)}</svg>
  <svg class="fr" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect x="44" y="44" width="${W - 88}" height="${H - 88}" fill="none" stroke="${T.line}" stroke-width="1.5"/>
    ${plateTicks(44, 44, W - 88, H - 88, e.accent, 34)}
    ${regMark(T.inkFaint)}
  </svg>
  <div class="c head"><b>GALACTIC DIRECTORY</b>&nbsp;&nbsp;·&nbsp;&nbsp;FIELD PLATE&nbsp;&nbsp;·&nbsp;&nbsp;L. MORKINSTAR
    <span class="r">ENTRY #${e.entry}</span></div>
  <div class="c relay">RECEIVED VIA RELAY &nbsp;·&nbsp; CARRIER LOCKED &nbsp;·&nbsp; SIGNAL <b>${relaySignal(e.entry)}%</b></div>
  <div class="c ttl">
    <h1>${esc(e.title)}</h1>
    <div class="sub"><s>${esc(e.planet)}</s> &nbsp;·&nbsp; ${esc(e.system)} &nbsp;·&nbsp; SERIES ${esc(e.pos)}${e.cat ? " &nbsp;·&nbsp; CATEGORY " + e.cat : ""}</div>
  </div>
  <svg class="c art" viewBox="0 0 1000 760">${sigilWatermark(e.glyph, e.accent, ...(e.wm || [500, 340, 460]))}${e.art(e.accent)}</svg>
  <div class="c rstat">RENDERING: ${esc(rs.text)}</div>
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
</div></body></html>`; };

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
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${PT.mono}" font-size="${sz}" fill="${c}" letter-spacing="1.3" ${halo(PT.paper1, 3)}>${esc(t)}</text>`;
const pln = (x1, y1, x2, y2, s, o = 1, w = 2) =>
  `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${s}" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;

// P1 — the case. Ninety-one slots, one filled. And two chairs.
function s2case(a) {
  let o = witness("ossul", "Ossul", 520, 400, 560, PT.ink, 0.5, (x, y, t) => plbl(x, y, t, PT.inkDim, 13, "start"));
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
  let o = plbl(80, 78, "THE SYLLABUS OF HALLOVAR", PT.inkDim, 16);
  for (let i = 0; i < 340; i++) {
    const col = i % 34, row = Math.floor(i / 34);
    const x = 84 + col * 25, y = 112 + row * 34;
    const late = i > 250, wob = late ? (i % 3) - 1 : 0;
    o += pln(x, y + wob, x + 17, y + wob + (late ? (i % 2 ? 1.5 : -1) : 0), PT.ink, late ? 0.45 : 0.72, 2);
  }
  o += plbl(920, 112, "1", PT.inkFaint, 13, "end");
  o += plbl(920, 452, "340", PT.inkFaint, 13, "end");
  o += plbl(80, 452, "the handwriting gets worse. you can date them by it.", PT.inkFaint, 14);
  // Panel drawn before the portrait (not after) so its translucent fill sits
  // as a backdrop instead of washing the portrait out; portrait sized/placed
  // to clear both the panel's borders and the "nothing under it" caption.
  o += `<rect x="80" y="500" width="840" height="150" rx="6" fill="${PT.panel}" fill-opacity="0.7" stroke="${a}" stroke-width="3"/>`;
  o += witness("hallovar", "Hallovar", 520, 400, 560, PT.ink, 0.5, (x, y, t) => plbl(x, y, t, PT.inkDim, 13, "start"));
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
    accent: "#8A6A2F", art: s2case, glyph: "The Case", wm: [370, 250, 420] },
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
    accent: "#5B4A7A", art: s2unsaid, glyph: "The Ovai", wm: [300, 400, 420] },
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
    accent: "#9E3B2E", art: s2backofcase, glyph: "Vænheim", wm: [350, 230, 420] },
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
  <svg class="fr" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${slotFrame(76, 44, W - 152, H - 88, e.accent, e.p)}${regMark(PT.inkFaint)}</svg>
  <div class="c head"><b>PAGE ${e.p} OF 91</b>&nbsp;&nbsp;·&nbsp;&nbsp;NOT FILED&nbsp;&nbsp;·&nbsp;&nbsp;L. MORKINSTAR
    <span class="r">CONCLUDED: ${e.concluded}</span></div>
  <div class="c ttl">
    <h1>${esc(e.title)}</h1>
    <div class="sub"><s>${esc(e.where)}</s> &nbsp;·&nbsp; THE NINETY-ONE PAGES &nbsp;·&nbsp; SEASON TWO</div>
  </div>
  <svg class="c art" viewBox="0 0 1000 760">${sigilWatermark(e.glyph, e.accent, ...(e.wm || [500, 310, 460]))}${e.art(e.accent)}</svg>
  <div class="c foot">
    <div class="rule"></div>
    <div class="ph">${esc(e.phenom)}</div>
    <div class="nt">${esc(e.note)}</div>
    <div class="bar"><span>${esc(e.glyph.toUpperCase())}</span>
      <span class="sp">THE MORKINSTAR JOURNALS · S2 · ${e.n} / 10</span></div>
  </div>
</div></body></html>`;

// ═══════════════════════════════════════════════════════════════════════════
// SEASON THREE. He is burning his own case, one page at a time, in the correct
// order. Same paper as Season Two — it is the same case — but every plate here
// is that page in the process of being destroyed: scorch eating in from the
// edge nearest the fire, char, curl, ash, the ink losing its color as it goes.
// Damage is driven by the piece's position in the burn (1 of 13 .. 13 of 13),
// not hand-tuned per plate, so the case gets visibly, systematically thinner as
// the season goes. The frame stops being a slot marker — how many pages are
// left — and becomes a WITHDRAWN stamp: this one is leaving. Plate 14 breaks
// the pattern on purpose. It is the only page that goes back in unburnt.
// ═══════════════════════════════════════════════════════════════════════════
const BURN = "#241811", SCORCH = "#7A4526";

// Tiny seeded PRNG so the char marks are stable across renders, not fresh
// noise on every run — a scorch pattern that changed each rebuild would read
// as random damage, not as the same page burning the same way twice.
function lcg(seed) {
  let s = (seed >>> 0) || 1;
  return () => (s = (s * 48271) % 0x7fffffff) / 0x7fffffff;
}
const hexLerp = (c1, c2, t) => {
  const n1 = parseInt(c1.slice(1), 16), n2 = parseInt(c2.slice(1), 16);
  const ch = (n) => [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const [r1, g1, b1] = ch(n1), [r2, g2, b2] = ch(n2);
  const m = (x, y) => Math.round(x + (y - x) * t);
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`;
};

// damage 0 (untouched) .. 1 (nearly gone), eased so the first few pages read
// as lightly marked and the loss compounds toward the end of the case.
const burnDmg = (i, of = 13) => Math.pow(i / of, 1.3);

// A jagged burnt hole: black centre, scorched rim. Same shape vocabulary every
// time — it's paper burning, not a different kind of damage per plate.
function charHole(cx, cy, r, seed) {
  const rnd = lcg(seed);
  let d = "";
  for (let i = 0; i <= 11; i++) {
    const ang = (i / 11) * 2 * Math.PI;
    const rr = r * (0.55 + rnd() * 0.55);
    d += `${i ? "L" : "M"}${(cx + Math.cos(ang) * rr).toFixed(1)} ${(cy + Math.sin(ang) * rr).toFixed(1)}`;
  }
  return `<path d="${d}Z" fill="${BURN}"/><path d="${d}Z" fill="none" stroke="${SCORCH}" stroke-width="3" stroke-opacity="0.85"/>`;
}

// The damage pass every burned plate's art ends with: holes climbing off the
// bottom-right (the edge nearest the fire in his hand), a curling corner, ash.
function charOverlay(dmg, seed) {
  if (dmg <= 0.02) return "";
  const rnd = lcg(seed * 97 + 1);
  let o = "";
  // Kept to the far bottom-right — every piece keeps its own caption text
  // left- or centre-set well clear of this corner, so damage never eats words.
  const holes = Math.round(2 + dmg * 9);
  for (let i = 0; i < holes; i++) {
    const cx = 780 + rnd() * 200, cy = 440 + rnd() * 280;
    o += charHole(cx, cy, 8 + rnd() * 12 + dmg * 12, seed * 7 + i + 1);
  }
  const cr = 50 + dmg * 200;
  o += `<path d="M${(1000 - cr).toFixed(1)} 760 Q${(1000 - cr * 0.4).toFixed(1)} ${(760 - cr * 0.7).toFixed(1)} 1000 ${(760 - cr).toFixed(1)} L1000 760 Z" fill="${BURN}" opacity="${(0.55 + dmg * 0.4).toFixed(2)}"/>`;
  o += `<path d="M${(1000 - cr).toFixed(1)} 760 Q${(1000 - cr * 0.4).toFixed(1)} ${(760 - cr * 0.7).toFixed(1)} 1000 ${(760 - cr).toFixed(1)}" fill="none" stroke="${SCORCH}" stroke-width="4.5" opacity="0.85"/>`;
  const ash = Math.round(dmg * 14);
  for (let i = 0; i < ash; i++) {
    const x = 480 + rnd() * 520, y = 40 + rnd() * 680;
    o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1 + rnd() * 2).toFixed(1)}" fill="${SCORCH}" fill-opacity="${(0.3 + rnd() * 0.4).toFixed(2)}"/>`;
  }
  return o;
}

// ── the fourteen remnants ────────────────────────────────────────────────
// Each draws a SIMPLIFIED, already-wrecked sketch of the page it is burning
// (its own S1/S2 plate motif where one exists, an invented one for the four
// pages nobody has seen), then hands off to charOverlay for the systematic
// damage pass. The wreck is in the drawing; the SEVERITY is in the index.

// 01. page 1, Ossul. The case, one tick lit, and the word he can't reread.
function s3ossul(a, dmg) {
  let o = "";
  o += `<rect x="90" y="90" width="560" height="230" rx="6" fill="none" stroke="${PT.ink}" stroke-opacity="${(0.85 - dmg * 0.3).toFixed(2)}" stroke-width="3"/>`;
  for (let i = 0; i < 91; i++) {
    const col = i % 26, row = Math.floor(i / 26);
    const x = 118 + col * 20, y = 128 + row * 62;
    o += pln(x, y, x, y + 46, i === 0 ? a : PT.line, i === 0 ? 1 : 0.4, i === 0 ? 4 : 1.4);
  }
  o += plbl(90, 350, "PAGE ONE. WHAT WENT IN FIRST.", PT.inkDim, 16);
  const rows = [["THE PASTE", true], ["THE STONE", true], ["THE WORD", false]];
  rows.forEach(([t, ok], i) => {
    const y = 410 + i * 46;
    o += plbl(90, y, t, ok ? PT.ink : PT.red, 19);
    if (ok) o += pln(280, y - 6, 560, y - 6, PT.inkFaint, 0.5, 2);
    else {
      let d = "M280 " + (y - 6);
      for (let k = 1; k <= 10; k++) d += ` L${280 + k * 28} ${y - 6 + (k % 2 ? -9 : 9)}`;
      o += `<path d="${d}" fill="none" stroke="${PT.red}" stroke-opacity="0.75" stroke-width="2.5" stroke-linecap="round"/>`;
    }
  });
  o += plbl(90, 610, "TWENTY-TWO GALAXALS. NOBODY STAYED LONG ENOUGH TO HEAR IT TWICE.", PT.inkFaint, 15);
  return o + charOverlay(dmg, 1);
}

// 02. page 12, unseen. Mrit'havn: one question, once, and a smoke column.
function s3askdead(a, dmg) {
  let o = "";
  o += `<ellipse cx="260" cy="260" rx="150" ry="180" fill="${PT.panel}" fill-opacity="0.6" stroke="${a}" stroke-width="3"/>`;
  [190, 240, 290, 330, 370].forEach((y) => {
    o += pln(200, y, 320, y, PT.inkFaint, 0.5, 2);
    o += pln(205, y - 8, 315, y + 8, PT.red, 0.55, 2);
  });
  o += pln(200, 410, 320, 410, a, 0.95, 3.5);
  o += plbl(260, 452, "SÖLRUN'S HUNDRED AND SIX", PT.inkDim, 15, "middle");
  o += `<path d="M700 640 C 690 560, 730 520, 706 460 C 686 410, 730 370, 706 300" fill="none" stroke="${a}" stroke-opacity="0.7" stroke-width="3" stroke-dasharray="2 10"/>`;
  o += pln(620, 640, 780, 640, PT.line, 1, 2);
  o += plbl(700, 680, "THE COLUMN HOLDS ITS SHAPE, THEN DOESN'T", PT.inkFaint, 14, "middle");
  o += plbl(90, 80, "MRIT'HAVN · YOU MAY ASK YOUR DEAD ONE QUESTION. ONCE.", PT.inkDim, 16);
  o += plbl(90, 720, "A LIFE SPENT ARRIVING AT IT.", a, 18);
  return o + charOverlay(dmg, 2);
}

// 03. page 16, Ilmarrow. The syllabus, and Lesson 341 with nothing under it.
function s3lesson(a, dmg) {
  let o = "";
  o += plbl(80, 78, "THE SYLLABUS OF HALLOVAR", PT.inkDim, 16);
  for (let i = 0; i < 200; i++) {
    const col = i % 34, row = Math.floor(i / 34);
    const x = 84 + col * 25, y = 112 + row * 34;
    o += pln(x, y, x + 17, y, PT.ink, 0.5, 2);
  }
  o += `<rect x="80" y="360" width="840" height="130" rx="6" fill="${PT.panel}" fill-opacity="0.65" stroke="${a}" stroke-width="3"/>`;
  o += plbl(104, 400, "LESSON 341", a, 18);
  o += plbl(104, 436, "“What To Do When It Goes Wrong", PT.ink, 22);
  o += plbl(104, 466, "And I Am Not Here”", PT.ink, 22);
  o += plbl(896, 400, "( nothing under it )", PT.red, 15, "end");
  o += plbl(80, 540, "THE HAND HURRIES BY LESSON THREE HUNDRED.", PT.inkFaint, 15);
  o += plbl(80, 600, "HE READ THIS ONE MOST NIGHTS. NOT FOR THE RECORD.", PT.ink, 17);
  return o + charOverlay(dmg, 3);
}

// 04. page 23, Threnn. Two figures, a broken arc, and a sentence that stops.
function s3threnn(a, dmg) {
  let o = "";
  const fig = (x, y, solid) => `<g transform="translate(${x},${y})" fill="none" stroke="${solid ? PT.ink : PT.red}" stroke-opacity="${solid ? 0.9 : 0.55}" stroke-width="3" stroke-linecap="round"${solid ? "" : ` stroke-dasharray="6 8"`}>
    <circle cx="0" cy="-90" r="22"/><path d="M0 -68 V-10"/><path d="M-24 -48 H24"/><path d="M0 -10 L-20 48 M0 -10 L20 48"/></g>`;
  o += fig(260, 340, true) + fig(320, 350, false);
  o += `<path d="M180 220 Q290 170 400 220" fill="none" stroke="${a}" stroke-opacity="0.6" stroke-width="2.5" stroke-dasharray="3 9"/>`;
  o += plbl(90, 80, "ONLY THE UNSAID CAN REACH YOU.", PT.ink, 18);
  o += plbl(90, 470, "SHE ASKED TWICE. HE SAID NO TWICE.", PT.inkDim, 16);
  o += plbl(90, 560, "“Well.", PT.red, 30);
  o += plbl(90, 596, "It starts.”", PT.inkFaint, 22);
  o += plbl(90, 660, "THAT IS AS FAR AS IT EVER GOT.", PT.red, 16);
  return o + charOverlay(dmg, 4);
}

// 05. page 34, unseen. One sentence, blind fish, a door, an apology under it.
function s3fish(a, dmg) {
  let o = "";
  o += pln(80, 420, 920, 420, PT.line, 0.9, 2.5);
  o += `<rect x="740" y="220" width="90" height="200" rx="4" fill="none" stroke="${PT.ink}" stroke-opacity="0.8" stroke-width="3"/>`;
  o += plbl(785, 448, "THE DOOR", PT.inkFaint, 14, "middle");
  o += `<path d="M300 460 Q360 440 420 460 Q460 468 500 452 L560 462 Q600 452 640 462 L700 452" fill="none" stroke="${a}" stroke-opacity="0.85" stroke-width="3" stroke-linecap="round"/>`;
  o += `<circle cx="695" cy="452" r="5" fill="${a}"/>`;
  o += plbl(90, 90, "ONE SENTENCE.", PT.inkDim, 18);
  o += plbl(90, 560, "“The blind fish in the flooded temple", PT.ink, 24);
  o += plbl(90, 596, "still turn toward the door when it opens.”", PT.ink, 24);
  o += plbl(90, 650, "AN APOLOGY UNDERNEATH, IN SMALLER WRITING.", PT.inkFaint, 15);
  return o + charOverlay(dmg, 5);
}

// 06. page 30. The weighing, run once more before it goes.
function s3weighing(a, dmg) {
  let o = "";
  const pan = (x, y, w, l1, v, red) => {
    let s = `<path d="M${x} ${y} L${x + w} ${y}" stroke="${PT.ink}" stroke-width="3"/>`;
    s += `<path d="M${x + w / 2} ${y} V${y - 50}" stroke="${PT.ink}" stroke-width="2.5"/>`;
    s += `<path d="M${x + 8} ${y} Q${x + w / 2} ${y + 40} ${x + w - 8} ${y}" fill="none" stroke="${PT.ink}" stroke-width="2.5"/>`;
    s += plbl(x + w / 2, y - 64, l1, PT.inkDim, 14, "middle");
    s += plbl(x + w / 2, y + 76, v, red ? PT.red : PT.ink, 22, "middle");
    return s;
  };
  o += pan(120, 240, 220, "WHOLE, THAT NIGHT", "7268g", false);
  o += plbl(500, 250, "→", PT.red, 40, "middle");
  o += pan(660, 240, 220, "TONIGHT, ONE PAGE STILL IN", "6991g", true);
  o += plbl(90, 400, "LIGHTER BY MORE THAN THE PAPER ACCOUNTS FOR.", PT.red, 17);
  o += plbl(90, 460, "SIX. EIGHT. NINETEEN. NO EXPLANATION WRITTEN UNDER IT.", PT.inkDim, 16);
  o += plbl(90, 560, "“THAT IS THE ENTIRE ENTRY.", PT.ink, 20);
  o += plbl(90, 596, "I AM NOT GOING TO WRITE WHAT I THINK IT MEANS.”", PT.ink, 20);
  return o + charOverlay(dmg, 6);
}

// 07. page 44, unseen. Sorvann's fourteenth, finally named after him.
function s3sorvann(a, dmg) {
  let o = "";
  for (let i = 0; i < 14; i++) {
    const y = 110 + i * 40, last = i === 13;
    o += pln(90, y, last ? 320 : 260 + (i % 3) * 20, y, last ? a : PT.inkFaint, last ? 1 : 0.55, last ? 3.5 : 1.8);
  }
  o += plbl(90, 90, "FOURTEEN GODS. FOURTEEN MONSTERS.", PT.inkDim, 16);
  o += plbl(340, 668, "MÖRK", a, 30);
  o += plbl(340, 700, "the fourteenth's name, given after he left", PT.inkFaint, 15);
  o += `<path d="M600 200 Q660 140 740 200 Q800 260 740 340 Q660 400 600 340 Q560 260 600 200 Z" fill="${PT.panel}" fill-opacity="0.5" stroke="${PT.line}" stroke-width="2"/>`;
  o += plbl(670, 440, "SORVANN · THE MARSH", PT.inkDim, 15, "middle");
  o += plbl(90, 560, "HE COULD HAVE WRITTEN BACK. HE HAD THE CLICKS.", PT.red, 17);
  return o + charOverlay(dmg, 7);
}

// 08. page 47, Kaunis. The Vedrei's wall, and the one he does not have.
function s3wall(a, dmg) {
  let o = "";
  for (let i = 0; i < 40; i++) {
    const x = 84 + (i % 10) * 42, y = 110 + Math.floor(i / 10) * 46;
    o += `<rect x="${x}" y="${y}" width="32" height="34" fill="none" stroke="${PT.line}" stroke-width="1.4"/>`;
  }
  o += `<rect x="80" y="330" width="840" height="150" rx="4" fill="none" stroke="${PT.ink}" stroke-width="3"/>`;
  o += plbl(500, 380, "THE VEDREI'S WALL", PT.inkDim, 15, "middle");
  o += plbl(500, 436, "41,206", PT.red, 46, "middle");
  o += plbl(500, 466, "NAMED, IN DAYLIGHT, ON A WALL BUILT FOR THE PURPOSE.", PT.inkDim, 14, "middle");
  o += plbl(80, 560, "I HAVE NINETY PAGES AND NO WALL.", PT.ink, 19);
  o += plbl(80, 596, "A WORLD THAT GETS A WALL, AND A MAN WHO DOES NOT.", PT.inkFaint, 15);
  return o + charOverlay(dmg, 8);
}

// 09. page 61, unseen. A lineage that ends on Yska, and stops there.
function s3lineage(a, dmg) {
  let o = "";
  const names = ["VOTHRIN", "ALDIS", "RANKA", "YSKA"];
  names.forEach((n, i) => {
    const x = 140 + i * 200;
    o += `<circle cx="${x}" cy="300" r="8" fill="${a}"/>`;
    o += plbl(x, 340, n, PT.ink, 16, "middle");
    if (i < names.length - 1) o += pln(x + 14, 300, x + 186, 300, a, 0.8, 2.5);
  });
  o += `<line x1="940" y1="300" x2="990" y2="300" stroke="${PT.red}" stroke-opacity="0.7" stroke-width="2.5" stroke-dasharray="3 6" stroke-linecap="round"/>`;
  o += plbl(990, 390, "( no next name. never was. )", PT.red, 14, "end");
  o += plbl(90, 90, "A LINE NEVER WRITTEN DOWN — UNTIL THAT NIGHT, ON ILYRSK.", PT.inkDim, 16);
  o += plbl(90, 560, "THE ONLY PAGE HE DID NOT WRITE ALONE.", PT.ink, 19);
  o += plbl(90, 596, "IT TOOK TWO OF THEM TO WRITE IT. ONE OF HIM TO BURN IT.", PT.inkFaint, 15);
  return o + charOverlay(dmg, 9);
}

// 10. page 38. Six worlds, six fences, the map nobody else ever had.
function s3map(a, dmg) {
  let o = "";
  const W3 = [[220, 180], [740, 220], [820, 500], [520, 620], [200, 520], [430, 340]];
  for (let i = 0; i < W3.length; i++) {
    const [x1, y1] = W3[i], [x2, y2] = W3[(i + 3) % W3.length];
    o += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${a}" stroke-opacity="0.5" stroke-width="2" stroke-dasharray="6 6" stroke-linecap="round"/>`;
  }
  W3.forEach(([x, y]) => { o += `<circle cx="${x}" cy="${y}" r="16" fill="${PT.paper0}" stroke="${PT.ink}" stroke-width="2.5"/>`; });
  o += plbl(90, 90, "SIX WORLDS. THREE PAIRS OF LINES COME DOWN ON TOP OF EACH OTHER.", PT.inkDim, 16);
  o += plbl(90, 700, "NOBODY ELSE HAS THIS MAP. IN A MINUTE, NOBODY WILL.", PT.red, 18);
  return o + charOverlay(dmg, 10);
}

// 11. page 73, unseen. Four names. Two he can still do something with.
function s3fournames(a, dmg) {
  let o = "";
  const rows = [["SARN", true], ["ÖYLA", true], ["RÆL", false], ["TUVID", false]];
  rows.forEach(([n, known], i) => {
    const y = 200 + i * 90;
    o += `<rect x="200" y="${y - 40}" width="600" height="64" rx="6" fill="none" stroke="${known ? a : PT.red}" stroke-opacity="${known ? 0.8 : 0.5}" stroke-width="2.5"${known ? "" : ` stroke-dasharray="6 7"`}/>`;
    o += plbl(500, y, n, known ? PT.ink : PT.red, 26, "middle");
  });
  o += plbl(90, 90, "FOUR NAMES. NOTHING ELSE ON THE PAGE.", PT.inkDim, 17);
  o += plbl(90, 640, "TWO HE CAN STILL DO SOMETHING WITH.", PT.ink, 17);
  o += plbl(90, 676, "TWO ARE ALREADY GONE FROM EVERYWHERE ELSE.", PT.red, 17);
  return o + charOverlay(dmg, 11);
}

// 12. page 58. The turn: a hand that is not his, and a self-portrait.
function s3turn(a, dmg) {
  let o = "";
  const rows = [["day 1", "0.0005", "0.00051"], ["momenta 1", "0.0009", "0.00094"], ["momenta 2", "0.0014", "0.00139"]];
  rows.forEach(([d, mine, fixed], i) => {
    const y = 150 + i * 70;
    o += plbl(104, y, d, PT.inkFaint, 16);
    o += plbl(360, y, mine, PT.ink, 19, "end");
    o += pln(280, y - 6, 380, y - 6, PT.red, 0.8, 2);
    o += plbl(440, y - 10, fixed, PT.red, 19);
  });
  o += plbl(440, 96, "in a hand that is not his", PT.red, 15);
  o += `<rect x="80" y="420" width="840" height="120" rx="6" fill="none" stroke="${a}" stroke-width="3"/>`;
  o += plbl(500, 468, "AN ARCHIVE OF ONE AUTHOR IS NOT AN ARCHIVE.", a, 20, "middle");
  o += plbl(500, 502, "IT IS A SELF-PORTRAIT. AND A PORTRAIT LOOKS BACK.", PT.inkDim, 16, "middle");
  o += plbl(90, 610, "HE WORKED IT OUT. HE DID NOT LISTEN.", PT.red, 18);
  return o + charOverlay(dmg, 12);
}

// 13. page 91. The fourteenth's name, in the last slot, hardest to burn.
function s3name(a, dmg) {
  let o = "";
  o += `<rect x="200" y="130" width="600" height="220" rx="6" fill="${PT.panel}" fill-opacity="0.7" stroke="${PT.red}" stroke-width="3"/>`;
  o += plbl(500, 250, "████", PT.red, 46, "middle");
  o += plbl(500, 300, "THE FOURTEENTH'S NAME", PT.red, 16, "middle");
  o += plbl(90, 90, "THE LAST SLOT. FILLED A WHOLE SEASON EARLY, ON PURPOSE.", PT.inkDim, 16);
  o += plbl(90, 460, "WRITTEN ONCE, WHERE NOBODY WOULD EVER GO.", PT.ink, 18);
  o += plbl(90, 496, "THE FIRE IS THAT PLACE NOW TOO. HE KNOWS IT.", PT.inkFaint, 16);
  o += plbl(90, 600, "NINETY-ONE SLOTS. EVERY ONE OF THEM ABOUT TO BE EMPTY.", PT.red, 17);
  return o + charOverlay(dmg, 13);
}

// 14. the kept page. No damage pass. The only intact object in the season.
function s3kept(a) {
  let o = "";
  o += `<rect x="260" y="140" width="480" height="340" rx="6" fill="none" stroke="${a}" stroke-opacity="0.55" stroke-width="2.5"/>`;
  o += plbl(500, 540, "NOTHING WRITTEN ON IT.", PT.inkDim, 17, "middle");
  o += plbl(500, 574, "NOT TO MAKE A POINT OF IT.", PT.inkFaint, 15, "middle");
  o += plbl(500, 660, "THE ONLY THING LEFT THAT HAS NEVER HAD ANYTHING WRITTEN ON IT.", PT.inkDim, 15, "middle");
  return o;
}

// The withdrawn frame: no longer a count of how much of the case is left,
// only a mark that THIS page is leaving, plus corners chewed by whatever
// plate this is in the burn.
function withdrawnFrame(x, y, w, h, accent, dmg, seed) {
  let o = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${PT.line}" stroke-opacity="${(0.9 - dmg * 0.4).toFixed(2)}" stroke-width="1.5"/>`;
  if (dmg > 0.05) {
    o += charHole(x, y, 14 + dmg * 40, seed + 11);
    o += charHole(x + w, y + h, 12 + dmg * 44, seed + 23);
  }
  o += `<g transform="translate(${x + w - 214},${y + 40}) rotate(-8)" opacity="${(0.6 + dmg * 0.3).toFixed(2)}">
    <rect x="0" y="0" width="196" height="54" rx="4" fill="none" stroke="${PT.red}" stroke-width="3"/>
    <text x="98" y="35" text-anchor="middle" font-family="${PT.mono}" font-size="22" letter-spacing="3.2" fill="${PT.red}">WITHDRAWN</text>
  </g>`;
  return o;
}
// The kept frame: calm, no stamp of removal. A quieter mark that says this
// one stayed.
//
// Quiet is a matter of TREATMENT, not of contrast. The first version drew the
// word in the entry's accent at 0.8 on pale paper, which measured about 1.4:1
// and was effectively invisible — the one undamaged plate in the season had
// the one unreadable label in it. Every WITHDRAWN stamp reads fine because it
// uses a solid ink-weight red. So this now takes its calm from what it does
// NOT do — no rotation, no heavy rule, no red — and keeps the accent as a
// bar down the left edge, where colour is decoration rather than the only
// thing carrying the word.
function keptFrame(x, y, w, h, accent) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${PT.line}" stroke-opacity="0.7" stroke-width="1.5"/>
  <g transform="translate(${x + w - 190},${y + 40})">
    <rect x="0" y="0" width="172" height="54" rx="4" fill="none" stroke="${PT.inkDim}" stroke-width="1.5"/>
    <rect x="0" y="0" width="4" height="54" fill="${accent}"/>
    <text x="90" y="35" text-anchor="middle" font-family="${PT.mono}" font-size="20" letter-spacing="3" fill="${PT.ink}">KEPT</text>
  </g>`;
}

// Background: the same paper as Season Two, with a scorch climbing from the
// bottom edge — the end nearest the fire in his hand — proportional to damage.
function s3Defs(accent) {
  return paperDefs(accent) + `<defs><linearGradient id="s3scorch" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="${BURN}"/><stop offset="0.35" stop-color="${SCORCH}" stop-opacity="0.85"/>
    <stop offset="1" stop-color="${SCORCH}" stop-opacity="0"/></linearGradient></defs>`;
}
function s3Ground(W, H, accent, dmg) {
  let o = paperGround(W, H);
  if (dmg > 0.02) {
    // Capped well above the footer's caption block: the fire eats the page,
    // never the record printed below it, so the plate stays readable at any
    // damage level.
    const h = Math.min(60 + dmg * (H * 0.58), H - 1150);
    o += `<rect x="0" y="${(H - h).toFixed(1)}" width="${W}" height="${h.toFixed(1)}" fill="url(#s3scorch)" opacity="${(0.35 + dmg * 0.45).toFixed(2)}"/>`;
  }
  return o;
}
const s3TitleColor = (dmg) => hexLerp(PT.ink, SCORCH, Math.min(dmg, 0.7) * 0.6);

const S3 = [
  { n: "01", p: 1, k: 1, slug: "the-page-about-ossul", title: "The Page About Ossul", where: "Ossul, nine decks down",
    ph: "The first thing he put in is the first thing that goes.",
    nt: "A meal, a stone, and a word he can no longer read his own handwriting well enough to burn honestly.",
    art: s3ossul, glyph: "Ossul" },
  { n: "02", p: 12, k: 2, slug: "a-world-that-asks-the-dead-one-question", title: "A World That Asks The Dead One Question", where: "Mrit'havn — never filed",
    ph: "One question. Once. A life spent arriving at it.",
    nt: "There is exactly one copy of this page anywhere, and it is between two fingers.",
    art: s3askdead, glyph: "Sölrun" },
  { n: "03", p: 16, k: 3, slug: "the-lesson-he-does-not-reread", title: "The Lesson He Does Not Reread", where: "Ilmarrow",
    ph: "Three hundred and forty lessons, taught in full. The one after them, never.",
    nt: "On the nights the fire will not catch, this is the page he reads for company. Not tonight.",
    art: s3lesson, glyph: "Hallovar" },
  { n: "04", p: 23, k: 4, slug: "the-thing-i-did-not-say-on-threnn", title: "The Thing I Did Not Say On Threnn", where: "Threnn",
    ph: "She asked twice. He is about to burn the sentence unsaid, on purpose.",
    nt: "A whole world built to make it easy. He did not do the easy thing.",
    art: s3threnn, glyph: "The Ovai" },
  { n: "05", p: 34, k: 5, slug: "the-shortest-page-in-the-case", title: "The Shortest Page In The Case", where: "[unrecorded]",
    ph: "One sentence, and an apology for being one sentence.",
    nt: "There was nothing to add that would not make it worse. He agrees.",
    art: s3fish, glyph: "The Fish" },
  { n: "06", p: 30, k: 6, slug: "the-table-that-was-the-entire-entry", title: "The Table That Was The Entire Entry", where: "His ship",
    ph: "Run once more. Still lighter than the paper accounts for.",
    nt: "He kept the discipline of leaving a number alone. He wants you to know what that cost tonight.",
    art: s3weighing, glyph: "The Weight" },
  { n: "07", p: 44, k: 7, slug: "the-world-that-named-it-after-me", title: "The World That Named It After Me", where: "Sorvann — never filed",
    ph: "A stranger came, wrote everything down, and left. The marsh kept the name.",
    nt: "He is burning the only page that says he meant to write back.",
    art: s3sorvann, glyph: "Mörk" },
  { n: "08", p: 47, k: 8, slug: "the-wall-with-the-number-on-it", title: "The Wall With The Number On It", where: "Kaunis",
    ph: "A world that gets a wall, and a man who does not.",
    nt: "The Vedrei carve their cost where the next generation trips over it. He has ninety pages and no wall.",
    art: s3wall, glyph: "The Vedrei" },
  { n: "09", p: 61, k: 9, slug: "the-only-page-i-did-not-write-alone", title: "The Only Page I Did Not Write Alone", where: "Ilyrsk — never filed",
    ph: "A lineage never written down, until the night there was nobody left to say it.",
    nt: "It ends on her name and nothing after. He built a good argument for keeping it. He is not keeping it.",
    art: s3lineage, glyph: "Yska" },
  { n: "10", p: 38, k: 10, slug: "the-map-i-never-showed-them", title: "The Map I Never Showed Them", where: "Six worlds",
    ph: "The only table the six lines were ever laid on together.",
    nt: "When this goes in, the map does not become harder to find. It stops existing.",
    art: s3map, glyph: "The Bearing" },
  { n: "11", p: 73, k: 11, slug: "four-names-and-nothing-else", title: "Four Names And Nothing Else", where: "[unrecorded]",
    ph: "Four names, in his own hand. He can place two of them.",
    nt: "Ræl and Tuvid go in with the rest of the page, already gone from everywhere else.",
    art: s3fournames, glyph: "Ræl · Tuvid" },
  { n: "12", p: 58, k: 12, slug: "the-page-where-i-worked-it-out", title: "The Page Where I Worked It Out", where: "His ship",
    ph: "An archive of one author is not an archive. It is a self-portrait.",
    nt: "He wrote the cure down clearly enough for a stranger to read cold, and kept going anyway.",
    art: s3turn, glyph: "Skerrin" },
  { n: "13", p: 91, k: 13, slug: "the-name-goes-last", title: "The Name Goes Last", where: "The case",
    ph: "Written once, on purpose, in the one place nobody would ever go.",
    nt: "The fire is that place now too. He knows it, and says so, and lets it burn anyway.",
    art: s3name, glyph: "The Unnamed" },
  { n: "14", p: null, k: 14, slug: "one-page-kept", title: "One Page Kept", where: "The case, emptied",
    ph: "Ninety-one slots. Every one of them empty. One page, blank, going back in.",
    nt: "A complete account is a finished one. A page with nothing on it cannot be Concluded.",
    art: s3kept, glyph: "Kept" },
].map((e) => ({ ...e, accent: e.p ? hexLerp(T.amber, "#6E2418", (e.k - 1) / 12) : "#C9B27A" }));

const s3Plate = (e) => {
  const dmg = e.p ? burnDmg(e.k) : 0;
  const kept = !e.p;
  const headTxt = kept ? "KINDLING · ONE PAGE KEPT" : `KINDLING · PAGE ${e.p} WITHDRAWN`;
  const subTxt = kept
    ? `<s>${esc(e.where)}</s> &nbsp;·&nbsp; SEASON THREE &nbsp;·&nbsp; THE KEPT PAGE`
    : `<s>${esc(e.where)}</s> &nbsp;·&nbsp; KINDLING ${e.k} OF 14 &nbsp;·&nbsp; SEASON THREE`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${W}px;height:${H}px;background:${PT.paper1};font-family:${PT.sans};overflow:hidden}
  .p{position:relative;width:${W}px;height:${H}px}
  .bg{position:absolute;inset:0}.fr{position:absolute;inset:0;z-index:2}
  .c{position:absolute;z-index:3}
  .head{left:112px;right:76px;top:74px;display:flex;align-items:baseline;
    font-family:${PT.mono};font-size:19px;letter-spacing:2.6px;color:${PT.inkFaint}}
  .head b{color:${kept ? e.accent : PT.red};font-weight:600}
  .ttl{left:112px;right:76px;top:132px}
  .ttl h1{font-size:${kept ? 78 : 72}px;line-height:1.03;letter-spacing:-1.8px;color:${s3TitleColor(dmg)};font-weight:700}
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
  <svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s3Defs(e.accent)}${s3Ground(W, H, e.accent, dmg)}</svg>
  <svg class="fr" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${kept ? keptFrame(76, 44, W - 152, H - 88, e.accent) : withdrawnFrame(76, 44, W - 152, H - 88, e.accent, dmg, e.k)}${regMark(PT.inkFaint)}</svg>
  <div class="c head"><b>${headTxt}</b>&nbsp;&nbsp;·&nbsp;&nbsp;L. MORKINSTAR</div>
  <div class="c ttl">
    <h1>${esc(e.title)}</h1>
    <div class="sub">${subTxt}</div>
  </div>
  <svg class="c art" viewBox="0 0 1000 760">${sigilWatermark(e.glyph, e.accent, ...(e.wm || [500, 300, 400]))}${e.art(e.accent, dmg)}</svg>
  <div class="c foot">
    <div class="rule"></div>
    <div class="ph">${esc(e.ph)}</div>
    <div class="nt">${esc(e.nt)}</div>
    <div class="bar"><span style="color:${hexLerp(PT.inkFaint, "#C7B58C", Math.min(dmg * 1.6, 1))}">${esc(e.glyph.toUpperCase())}</span>
      <span class="sp">THE MORKINSTAR JOURNALS · S3 · ${e.n} / 14</span></div>
  </div>
</div></body></html>`;
};

// ═══════════════════════════════════════════════════════════════════════════
// SEASON FOUR. His medium stops being the notice and becomes the schema: a
// plate is now a municipal notice fly posted to a city wall, photographed at
// night under the district's own lighting, with a civic sign bolted over the
// top of it. See fiction/morkinstar-journals/s4-bible.md, "Art doctrine".
// Chrome is byte identical on all fourteen. Only the middle changes, same
// rule as every other season.
//
// Colour now means COVERAGE CLASS, not identity: full coverage reads a clean
// cyan, partial reads sodium orange, under review reads magenta, no coverage
// gets no neon at all (a plain steel grey, still legible, just not lit).
//
// Every hex below is measured against the two grounds it actually sits on,
// not chosen by eye. This project has shipped a 1.4:1 label before.
//   ground #0B0F0D vs cyan    #22D3EE = 10.68:1   panel #1E2723 vs cyan    #22D3EE = 8.48:1
//   ground #0B0F0D vs orange  #FFA733 =  9.95:1   panel #1E2723 vs orange  #FFA733 = 7.90:1
//   ground #0B0F0D vs magenta #F154D6 =  6.41:1   panel #1E2723 vs magenta #F154D6 = 5.10:1
//   ground #0B0F0D vs steel   #9AA5B1 =  7.71:1   panel #1E2723 vs steel   #9AA5B1 = 6.13:1
// All four clear WCAG AA's 4.5:1 for text and are well past AA-large's 3:1 for
// the heavier signage strokes. Ink, inkDim, inkFaint and amber are T's own
// tokens, already measured against this class of dark ground in every other
// season, so they are reused rather than re-justified here.
const S4T = {
  bg0: "#0B0F0D", bg1: "#151B18", panel: "#1E2723", line: "#2A322D",
  cyan: "#22D3EE", orange: "#FFA733", magenta: "#F154D6", steel: "#9AA5B1",
};
const TIER_ACCENT = { full: S4T.cyan, partial: S4T.orange, review: S4T.magenta, none: S4T.steel };
const TIER_LABEL = { full: "FULL COVERAGE", partial: "PARTIAL COVERAGE", review: "UNDER REVIEW", none: "NO COVERAGE" };

function s4Defs(accent) {
  return `<defs>
    <linearGradient id="s4bg" x1="0.1" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="${S4T.bg1}"/><stop offset="0.6" stop-color="${S4T.bg0}"/><stop offset="1" stop-color="#050706"/>
    </linearGradient>
    <radialGradient id="s4wet" cx="0.22" cy="0.02" r="0.9">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.16"/><stop offset="0.5" stop-color="${accent}" stop-opacity="0.04"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="s4sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0.32" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.05"/><stop offset="0.68" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="s4vig" cx="0.5" cy="0.48" r="0.76">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.52"/>
    </radialGradient>
    <filter id="s4grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <pattern id="s4hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="9" stroke="${T.ink}" stroke-width="1.6" stroke-opacity="0.9"/>
    </pattern>
  </defs>`;
}
const s4Ground = (W, H) => `
  <rect width="${W}" height="${H}" fill="url(#s4bg)"/>
  <rect width="${W}" height="${H}" fill="url(#s4wet)"/>
  <rect width="${W}" height="${H}" fill="url(#s4sheen)"/>
  <rect width="${W}" height="${H}" fill="url(#s4vig)"/>
  <rect width="${W}" height="${H}" filter="url(#s4grain)" opacity="0.05"/>`;

// Labels on the wet ground, haloed the same way every other season's are.
const s4lbl = (x, y, t, c = T.inkFaint, sz = 17, anchor = "start") =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${T.mono}" font-size="${sz}" fill="${c}" letter-spacing="1.3" ${halo(S4T.bg0, 3.5)}>${esc(t)}</text>`;

// The torn corner: countable ghost layers of earlier notices under the paint,
// one more layer per plate across the season, so a reader can hold plate
// fourteen's stack up against plate one's and count. Per the revision: this
// is the reader's audit trail against the finale, so it is drawn to a rule,
// never to taste. `n` is the plate's own position, 1 through 14.
function wallLayers(x, y, n, accent) {
  let o = "";
  for (let i = 0; i < n; i++) {
    const off = i * 2.1;
    const w = 108 - i * 2.2, h = 70 - i * 1.4;
    const tone = i % 2 ? T.inkFaint : accent;
    o += `<path d="M${(x + off).toFixed(1)} ${(y - off).toFixed(1)} L${(x + off + w).toFixed(1)} ${(y - off).toFixed(1)} L${(x + off).toFixed(1)} ${(y - off + h).toFixed(1)} Z"
      fill="${tone}" fill-opacity="${(0.05 + (i % 3) * 0.018).toFixed(3)}" stroke="${T.inkFaint}" stroke-opacity="0.4" stroke-width="1"/>`;
  }
  o += s4lbl(x + 6, y + 92, `${n} LAYER${n === 1 ? "" : "S"}`, T.inkFaint, 12);
  return o;
}

// The flat wayfinding figure every accessibility pictogram in this city uses:
// no interior, no face, no eyes, per the doctrine. Reused across every
// mechanism so the rendering choice reads as the CITY's, not fourteen
// different artists'. Only the hands, drawn separately by each art function
// at real crosshatch fidelity, are ever busy.
function s4fig(cx, cy, accent, { armL = "", armR = "" } = {}) {
  return `<g>
    <circle cx="${cx}" cy="${cy - 74}" r="21" fill="${accent}"/>
    <path d="M${cx - 28} ${cy - 40} L${cx + 28} ${cy - 40} L${cx + 21} ${cy + 58} L${cx - 21} ${cy + 58} Z" fill="${accent}"/>
    <path d="M${cx - 15} ${cy + 58} L${cx - 21} ${cy + 126} M${cx + 15} ${cy + 58} L${cx + 21} ${cy + 126}" stroke="${accent}" stroke-width="12" stroke-linecap="round"/>
    ${armL ? `<path d="M${cx - 22} ${cy - 28} ${armL}" stroke="${accent}" stroke-width="12" stroke-linecap="round" fill="none"/>` : ""}
    ${armR ? `<path d="M${cx + 22} ${cy - 28} ${armR}" stroke="${accent}" stroke-width="12" stroke-linecap="round" fill="none"/>` : ""}
  </g>`;
}
// A hand: crosshatch fill at a fidelity nothing else in the frame has, per
// the doctrine, because the one thing the rig can never flatten is what
// somebody is doing with theirs.
const s4hand = (cx, cy, r = 15) =>
  `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="url(#s4hatch)" stroke="${T.ink}" stroke-width="1.6"/>`;

// ── the fourteen mechanisms ──────────────────────────────────────────────
// Draw the mechanism, not a mood. A reader who has read the piece should be
// able to point at the part of the sign that is the twist.

// 01. Gate fourteen cycles open for nobody. The licence code under the
// grille is Corpus 2300: the only sentence of his ever reproduced at scale.
function s4gate(a) {
  let o = "";
  for (const x of [270, 560]) o += `<rect x="${x}" y="120" width="26" height="360" rx="6" fill="${S4T.panel}" stroke="${T.inkFaint}" stroke-width="2"/>`;
  o += `<rect x="296" y="286" width="264" height="15" rx="6" fill="${a}" fill-opacity="0.9" transform="rotate(-8 428 293)"/>`;
  o += s4lbl(296, 250, "GATE 14 · CYCLES OPEN", a, 19);
  o += s4lbl(296, 500, "NO BODY DETECTED · CLOSED 11 TIMES", T.danger, 16);
  o += `<rect x="650" y="140" width="230" height="150" rx="8" fill="${S4T.panel}" stroke="${T.inkFaint}" stroke-width="2"/>`;
  for (let i = 0; i < 6; i++) o += ln(672, 168 + i * 16, 858, 168 + i * 16, T.inkFaint, 0.45, 2);
  o += s4lbl(650, 320, "SPEAKER GRILLE", T.inkFaint, 13);
  o += s4lbl(650, 344, "LIC. CORPUS 2300", T.amber, 16);
  o += s4fig(150, 470, a, { armR: "L210 400 L235 440" });
  o += s4hand(235, 440);
  o += `<rect x="215" y="392" width="30" height="42" rx="4" fill="${T.ink}" fill-opacity="0.14" stroke="${T.inkFaint}" stroke-width="1.5"/>`;
  o += s4lbl(120, 570, "ORDINARY GATE, WORKING FINE", T.inkFaint, 14);
  o += s4lbl(90, 700, "ONE NOTICE, READ. ONE FAULT, FIXED.", T.ink, 19);
  return o;
}

// 02. The fourth riser, cut wrong on every public stair. Ondrit's tape is
// calibrated to a standard retired two rebasings ago, on purpose.
function s4riser(a) {
  let o = "";
  const steps = [0, 1, 2, 3, 4, 5];
  let x = 90;
  steps.forEach((i) => {
    const wrong = i === 3, h = wrong ? 96 : 62, w = 96;
    o += `<rect x="${x}" y="${560 - h}" width="${w}" height="${h}" fill="${S4T.panel}" stroke="${wrong ? T.danger : T.inkFaint}" stroke-width="${wrong ? 3 : 2}"/>`;
    if (wrong) o += s4lbl(x + 4, 560 - h - 14, "RISER 4 · BYELAW 14", T.danger, 14);
    x += w;
  });
  o += s4lbl(90, 600, "MANDATED IN THE CODE. NOBODY KNOWS WHY.", T.inkDim, 16);
  o += s4fig(770, 420, a, { armR: "L850 380 L880 350" });
  o += s4hand(880, 350, 13);
  o += `<rect x="700" y="330" width="200" height="20" rx="5" fill="none" stroke="${a}" stroke-width="3" transform="rotate(-14 800 340)"/>`;
  o += s4lbl(700, 300, "TAPE, RETIRED STANDARD", a, 15);
  o += s4lbl(90, 700, "ONDRIT LETS HIM HOLD IT. HE GIVES IT BACK.", T.ink, 19);
  return o;
}

// 03. The Ombri baseline was averaged from cold hold readings: the alarm
// state, filed as the greeting. Everyone's normal is someone's worst hour.
function s4eleven(a) {
  let o = "";
  o += `<rect x="90" y="90" width="360" height="200" rx="10" fill="${S4T.panel}" stroke="${T.inkFaint}" stroke-width="2"/>`;
  o += s4lbl(112, 122, "PUBLIC HEALTH BASELINE", T.inkDim, 14);
  o += s4lbl(112, 240, "READS AS: FEVER", T.danger, 24);
  o += s4lbl(112, 268, "SOURCE: COLD HOLD LEDGER", a, 14);
  o += s4fig(650, 430, a, { armL: "L580 470 L560 510", armR: "L720 470 L740 510" });
  o += s4hand(560, 510, 16) + s4hand(740, 510, 16);
  o += `<rect x="540" y="500" width="220" height="60" rx="10" fill="none" stroke="${a}" stroke-width="3"/>`;
  o += s4lbl(650, 600, "GRIPPING SOMETHING COLD. BOTH HANDS. NOT LETTING GO.", a, 15, "middle");
  o += s4lbl(90, 660, "PLATFORM HEATER: SEASONAL SCHEDULE", T.inkFaint, 15);
  o += s4lbl(90, 700, "RECALIBRATION: COSTED, APPROVED IN PRINCIPLE, DEFERRED.", T.inkDim, 16);
  return o;
}

// 04. A queue with no front. Both arms grow outward from a fixed midpoint.
function s4queue(a) {
  let o = "";
  o += ln(120, 380, 500, 380, a, 0.85, 4);
  o += ln(500, 380, 880, 380, T.inkDim, 0.6, 4);
  for (let i = 1; i <= 6; i++) { o += `<circle cx="${500 - i * 58}" cy="380" r="15" fill="none" stroke="${a}" stroke-width="2.5"/>`; }
  for (let i = 1; i <= 5; i++) { o += `<circle cx="${500 + i * 58}" cy="380" r="15" fill="none" stroke="${T.inkDim}" stroke-opacity="0.7" stroke-width="2"/>`; }
  o += `<rect x="470" y="330" width="60" height="100" rx="8" fill="${S4T.panel}" stroke="${a}" stroke-width="3"/>`;
  o += s4lbl(500, 300, "THE MIDDLE WINDOW", a, 18, "middle");
  o += s4fig(500, 560, a, { armR: "L560 520 L590 500" });
  o += s4hand(590, 500, 14);
  o += `<circle cx="640" cy="480" r="40" fill="none" stroke="${a}" stroke-width="3" stroke-dasharray="6 6"/>`;
  o += s4lbl(700, 486, "THE WHEEL · MOVED BY HAND, DAILY", a, 15);
  o += s4lbl(90, 718, "NOBODY IS EVER FIRST. NOBODY IS EVER LAST.", T.ink, 19);
  o += s4lbl(90, 748, "NO PHENOMENA OUTSTANDING.", T.inkFaint, 15);
  return o;
}

// 05. It rains indoors at fourteen past, on a facilities schedule nine
// generations mistook for scripture. The rain is real. The invention is theirs.
function s4rain(a) {
  let o = "";
  for (let i = 0; i < 24; i++) o += ln(120 + (i % 8) * 90, 100 + Math.floor(i / 8) * 60, 108 + (i % 8) * 90, 140 + Math.floor(i / 8) * 60, a, 0.5, 2.5);
  o += s4lbl(120, 320, "HEAT EXCHANGE SCHEDULE, BURIED IN A FACILITIES CONTRACT", T.inkDim, 15);
  o += `<circle cx="820" cy="200" r="70" fill="none" stroke="${T.inkFaint}" stroke-width="3"/>`;
  o += `<line x1="820" y1="200" x2="820" y2="150" stroke="${a}" stroke-width="4"/>`;
  o += `<line x1="820" y1="200" x2="855" y2="200" stroke="${a}" stroke-width="4"/>`;
  o += s4lbl(820, 296, ":14 PAST, EVERY TICK", a, 16, "middle");
  o += s4fig(300, 500, a, { armL: "L240 550 L220 590" });
  o += s4hand(220, 590, 15);
  o += `<path d="M190 590 Q220 610 250 590" fill="none" stroke="${T.inkFaint}" stroke-width="3"/>`;
  o += s4lbl(90, 660, "NINE GENERATIONS CHECK THE CORD EVERY MORNING.", T.inkDim, 16);
  o += s4lbl(90, 700, "WHAT THEY INVENTED WAS THE INVENTION.", T.ink, 19);
  return o;
}

// 06. Field fourteen: thirteen boxes and a fourteenth, greyed out, on a
// form filed by everyone in the galaxy. The pause, rendered as a UI state.
function s4field(a) {
  let o = "";
  for (let i = 0; i < 13; i++) o += `<rect x="90" y="${100 + i * 34}" width="360" height="26" rx="3" fill="none" stroke="${T.inkFaint}" stroke-opacity="0.7" stroke-width="2"/>`;
  const gy = 100 + 13 * 34;
  o += `<rect x="90" y="${gy}" width="360" height="26" rx="3" fill="${T.inkFaint}" fill-opacity="0.14" stroke="${T.danger}" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="4 5"/>`;
  o += s4lbl(90, gy - 10, "FIELD 14 · DISABLED, NOT DELETED", T.danger, 14);
  o += s4fig(700, 380, a, { armR: "L770 340 L800 310" });
  o += s4hand(800, 310, 15);
  o += `<rect x="620" y="220" width="220" height="70" rx="6" fill="${S4T.panel}" stroke="${a}" stroke-width="2.5"/>`;
  o += s4lbl(632, 262, "RETIRED PROOF, IN A DRAWER", a, 15);
  o += s4lbl(90, 600, "100% NULL, FOUR COLLECTION CYCLES RUNNING.", T.inkDim, 16);
  o += s4lbl(90, 660, "A DATA QUALITY DEFECT. SHE IS RIGHT.", T.ink, 19);
  o += s4lbl(90, 700, "THE LINE IS STILL THERE. IN EVERY FORM IN THE GALAXY.", T.inkFaint, 15);
  return o;
}

// 07. Public air, mixed to one blend, fourteen parts by volume, weighted to
// a galaxy that stopped existing. Rimmeleth counted three times over.
function s4air(a) {
  let o = "";
  const parts = [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]; // Rimmeleth's share, tripled
  let y = 100;
  parts.forEach((p, i) => {
    const h = 26 * p;
    o += `<rect x="120" y="${y}" width="120" height="${h - 3}" fill="${i === 0 ? a : T.inkFaint}" fill-opacity="${i === 0 ? 0.85 : 0.28}"/>`;
    y += h;
  });
  o += s4lbl(120, 88, "PUBLIC BLEND · 14 PARTS BY VOLUME", T.inkDim, 15);
  o += s4lbl(260, 118, "RIMMELETH, 3X OVERWEIGHTED", a, 15);
  o += s4fig(650, 420, a, { armR: "L720 380 L750 350" });
  o += s4hand(750, 350, 14);
  o += `<path d="M770 300 L800 300 L800 360 L770 360 Q756 330 770 300 Z" fill="${S4T.panel}" stroke="${a}" stroke-width="2.5"/>`;
  o += s4lbl(650, 470, "CERTIFIED REFERENCE BOTTLE", a, 15, "middle");
  o += s4lbl(90, 620, "RECERTIFYING THE PLANT MEANS RECERTIFYING THE TIER.", T.inkDim, 16);
  o += s4lbl(90, 660, "COMFORTABLE FOR NOBODY. SURVIVABLE FOR EVERYONE.", T.ink, 18);
  o += s4lbl(90, 700, "FOURTEEN IS A WORKING NUMBER HERE.", T.inkFaint, 15);
  return o;
}

// 08. A district built to the scale of the largest species, which priced
// that species out of it. Halkri commutes in to service doors she cannot use.
function s4gauge(a) {
  let o = "";
  o += `<rect x="120" y="90" width="560" height="420" rx="16" fill="none" stroke="${T.inkFaint}" stroke-width="3"/>`;
  o += `<rect x="180" y="150" width="120" height="300" rx="8" fill="${S4T.panel}" stroke="${a}" stroke-width="3"/>`;
  o += s4lbl(150, 126, "DOOR, BUILT TO THE HRAEDH HAND", a, 15);
  o += s4fig(340, 420, T.inkFaint, {});
  o += s4lbl(340, 610, "SMALL SPECIES, VERY CHEAP RENT", T.inkFaint, 14, "middle");
  // Halkri: much larger scale, one fine digit at the hinge
  o += `<g transform="translate(760,330)">
    <circle cx="0" cy="-150" r="42" fill="${a}"/>
    <path d="M-58 -84 L58 -84 L44 120 L-44 120 Z" fill="${a}"/>
    <path d="M-30 120 L-40 250 M30 120 L40 250" stroke="${a}" stroke-width="22" stroke-linecap="round"/>
    <path d="M-58 -60 L-140 20" stroke="${a}" stroke-width="20" stroke-linecap="round"/>
  </g>`;
  o += s4hand(636, 388, 11);
  o += s4lbl(760, 560, "HALKRI · ONE FINE DIGIT", a, 16, "middle");
  o += s4lbl(90, 640, "COST PER RESIDENT AT THIS SCALE. ARITHMETIC, NOT POLICY.", T.inkDim, 16);
  o += s4lbl(90, 700, "“THEN DO NOT WASTE THE PAPER ON ME.”", T.ink, 18);
  return o;
}

// 09. A ground levy with no originating instrument, securitised anyway into
// a pension. No paper means no end date. Rœst does not unfold the sheet all the way.
function s4rows(a) {
  let o = "";
  o += `<rect x="500" y="90" width="360" height="220" rx="8" fill="${S4T.panel}" stroke="${T.danger}" stroke-opacity="0.7" stroke-width="2.5" stroke-dasharray="3 3"/>`;
  o += s4lbl(520, 130, "ORIGINATING INSTRUMENT", T.danger, 15);
  o += s4lbl(520, 160, "NOT ON FILE. NEVER HAS BEEN.", T.danger, 15);
  for (let i = 0; i < 5; i++) o += `<rect x="90" y="${370 + i * 30}" width="330" height="22" rx="3" fill="none" stroke="${a}" stroke-opacity="0.7" stroke-width="2"/>`;
  o += s4lbl(90, 358, "QUARTERLY LEVY, COLLECTED FOREVER", a, 15);
  o += s4fig(700, 470, a, { armR: "L770 430 L800 400" });
  o += s4hand(800, 400, 14);
  o += `<rect x="620" y="606" width="220" height="120" rx="4" fill="${T.paper}" fill-opacity="0.08" stroke="${T.inkFaint}" stroke-width="1.5" transform="rotate(-4 730 666)"/>`;
  o += s4lbl(632, 648, "ELEVEN YEARS FOLDED.", T.inkDim, 14);
  o += s4lbl(632, 672, "NOT UNFOLDED ALL THE WAY.", T.inkDim, 14);
  o += s4lbl(90, 700, "THE WHOLE RETIREMENT PROVISION OF A PEOPLE, SECURITISED.", T.ink, 17);
  return o;
}

// 10. The reject log: every sentence he wrote with a hedge in it, unparseable
// at load, retained. The density curve peaks at #2284 and never comes back down.
function s4reject(a) {
  let o = "";
  const pts = [40, 60, 90, 150, 260, 400, 340, 260, 210, 180];
  let d = "";
  pts.forEach((v, i) => { const x = 120 + i * 76, y = 560 - v; d += `${i ? "L" : "M"}${x} ${y}`; });
  o += `<path d="${d}" fill="none" stroke="${a}" stroke-width="3.5"/>`;
  o += ln(120, 560, 120 + 9 * 76, 560, T.inkFaint, 0.6, 2);
  o += s4lbl(120 + 5 * 76, 178, "PEAK · ENTRY #2284", a, 16, "middle");
  o += s4lbl(90, 90, "REJECTION DENSITY, PER SOURCE ENTRY", T.inkDim, 15);
  o += s4fig(760, 460, a, { armR: "L820 420 L850 400" });
  o += s4hand(850, 400, 14);
  o += s4lbl(90, 660, "NO COLUMN FOR A HEDGE. A HEDGE IS NOT A VALUE.", T.ink, 18);
  o += s4lbl(90, 700, "THE REJECT LOG IS LONGER THAN THE DATASET.", T.inkFaint, 15);
  return o;
}

// 11. His own accreditation, still open, coded as a survey file by mistake,
// long ago. Nobody is protecting it. Danvik brings a chair, unexplained.
function s4annexe(a) {
  let o = "";
  o += `<rect x="120" y="100" width="420" height="280" rx="8" fill="${S4T.panel}" stroke="${a}" stroke-width="2.5"/>`;
  o += s4lbl(140, 136, "SURVEY FILE, STILL OPEN", a, 16);
  for (let i = 0; i < 4; i++) o += ln(140, 180 + i * 30, 500, 180 + i * 30, T.inkFaint, 0.5, 2);
  o += s4lbl(140, 340, "NO STATED END DATE.", T.danger, 15);
  o += `<rect x="600" y="240" width="90" height="140" rx="6" fill="none" stroke="${T.inkFaint}" stroke-width="2.5"/>`;
  o += `<rect x="600" y="360" width="90" height="10" fill="${T.inkFaint}" fill-opacity="0.5"/>`;
  o += s4lbl(600, 400, "THE CHAIR. NOT EXPLAINED.", T.inkFaint, 14);
  o += s4fig(830, 420, a, { armL: "L780 460 L750 480" });
  o += s4hand(750, 480, 14);
  o += s4lbl(90, 620, "A FILING ERROR, NOT A CONSPIRACY.", T.inkDim, 16);
  o += s4lbl(90, 660, "HE IS A CORRESPONDENT BECAUSE OF ONE.", T.ink, 18);
  o += s4lbl(90, 700, "FILES OPEN: UP, FOR THE FIRST TIME ALL SEASON.", T.danger, 15);
  return o;
}

// 12. Two columns: what reinforcement costs forever, and what unweighting
// would cost once. Column two is larger. It always will be. Osvær marks the pillar.
function s4tiers(a) {
  let o = "";
  const col = (x, label, v, big) => {
    let s = `<rect x="${x}" y="${560 - v}" width="180" height="${v}" fill="${big ? a : T.inkFaint}" fill-opacity="${big ? 0.7 : 0.35}"/>`;
    s += s4lbl(x + 90, 580, label, T.inkDim, 14, "middle");
    s += s4lbl(x + 90, 596, big ? "LARGER, EVERY YEAR" : "PAID, EVERY QUARTER", big ? a : T.inkFaint, 12, "middle");
    return s;
  };
  o += col(240, "GENERAL UNWEIGHTING", 420, true);
  o += col(560, "REINFORCEMENT, IN PERPETUITY", 260, false);
  o += s4lbl(90, 100, "SIGNED. COMPETENT. DEFERRED.", T.inkDim, 16);
  o += `<rect x="850" y="180" width="60" height="380" fill="${S4T.panel}" stroke="${T.inkFaint}" stroke-width="2"/>`;
  o += ln(850, 400, 910, 400, a, 1, 4);
  o += s4hand(940, 400, 13);
  o += s4lbl(840, 620, "THIS YEAR'S MARK", a, 14, "end");
  o += s4lbl(90, 660, "“THAT IS SKERRIN'S MASS, NO NAME ON IT.”", T.ink, 17);
  return o;
}

// 13. No Common here. Nobody perceives anybody. Rails are continuous, doors
// have bells you feel, and he is not the exception, for the only time in his life.
function s4mile(a) {
  let o = "";
  o += `<path d="M90 500 H910" stroke="${a}" stroke-width="6" stroke-linecap="round"/>`;
  for (const x of [220, 460, 700]) {
    o += `<rect x="${x}" y="300" width="70" height="200" rx="4" fill="${S4T.panel}" stroke="${T.inkFaint}" stroke-width="2"/>`;
    o += `<circle cx="${x + 35}" cy="360" r="10" fill="none" stroke="${a}" stroke-width="2.5"/>`;
    o += s4lbl(x + 35, 340, "BELL, FELT", T.inkFaint, 11, "middle");
  }
  o += s4lbl(90, 260, "RAILS: CONTINUOUS. DOORS: BELLS YOU FEEL THROUGH THE FRAME.", T.inkDim, 15);
  o += s4lbl(90, 620, "NO CANDIDATE FOR COVERAGE HERE COULD PERCEIVE ANOTHER EITHER.", T.inkFaint, 14);
  o += s4lbl(90, 660, "NOBODY IS THE EXCEPTION, BECAUSE NOBODY IS THE RULE.", T.ink, 18);
  o += s4lbl(90, 700, "THE SERVICE CHARGE IS THE ONLY THING HE CANNOT PAY.", T.inkFaint, 15);
  return o;
}

// 14. The corner that lifts. All fourteen layers, stacked, and a hand
// pressing the one that keeps rising back down. Paint is not fire.
function s4corner(a) {
  let o = wallLayers(150, 460, 14, a);
  o += s4fig(650, 420, a, { armR: "L700 380 L730 360" });
  o += s4hand(730, 360, 15);
  o += `<rect x="600" y="200" width="260" height="140" rx="4" fill="none" stroke="${a}" stroke-width="2.5"/>`;
  o += s4lbl(730, 170, "TODAY'S NOTICE, GOING UP", a, 15, "middle");
  o += s4lbl(90, 130, "CLEARED IN 0 TICKS: THE WALL'S SCHEDULE, NOT A KINDNESS.", T.inkDim, 15);
  o += s4lbl(90, 640, "HE IS PLEASED. HE HAS DONE THE ARITHMETIC WRONG.", T.ink, 18);
  o += s4lbl(90, 680, "PAINT IS NOT FIRE. NOTHING HAS EVER LEFT THIS WALL.", T.danger, 17);
  o += s4lbl(90, 720, "HEVRIT READS THEM ALL, IN ORDER. SHE KEEPS NONE.", T.inkFaint, 14);
  return o;
}

// ── the register ─────────────────────────────────────────────────────────
// Every figure below is copied straight out of s4-bible.md's register table
// and arc table, not invented here, so nothing in the small print can drift
// against the source of truth.
const ENTRIES4 = [
  { n: "01", slug: "the-line-it-plays-when-it-cannot-see-you", title: "The Line It Plays When It Cannot See You",
    district: "THE LONG CONCOURSE", abbr: "LC", tier: "full", clearedIn: "40 TICKS", filesOpen: 19, citations: 1206,
    momentaBelow: 0, accession: "CIVIC · LC-00", corpusCite: "#2300", owner: "TRANSIT AUTHORITY",
    phenom: "A fare gate that opens for nobody, once a shift, closed as fixed eleven times.",
    note: "The licence code under the speaker grille is Corpus 2300. He posts a notice about gate fourteen, and somebody reads it.",
    art: s4gate, glyph: "Gate Fourteen" },
  { n: "02", slug: "the-fourth-riser", title: "The Fourth Riser",
    district: "THE STEPPED QUARTER", abbr: "SQ", tier: "full", clearedIn: "24 TICKS", filesOpen: 19, citations: 1140,
    momentaBelow: 0, accession: "ACC 03", corpusCite: "#0412", owner: "CIVIC WORKS DEPT",
    phenom: "Every public stair in the city has one riser cut to the wrong height, mandated in the code.",
    note: "Ondrit's tape is calibrated to a standard retired two rebasings ago, on purpose, because the old stairs were cut to it.",
    art: s4riser, glyph: "Ondrit" },
  { n: "03", slug: "read-as-a-fever", title: "Read As A Fever",
    district: "ELEVEN HOLD", abbr: "EH", tier: "partial", clearedIn: "90 TICKS", filesOpen: 18, citations: 998,
    momentaBelow: 0, accession: "ACC 01", corpusCite: "#2269", owner: "HEALTH & WELFARE OFFICE",
    phenom: "The Ombri baseline reads as fever because it was averaged from cold hold readings, the alarm state, not the greeting.",
    note: "Recalibration is costed and approved in principle. The file does not move. The board moves anyway, for reasons unrelated to him.",
    art: s4eleven, glyph: "Ombri" },
  { n: "04", slug: "the-queue-with-no-front", title: "The Queue With No Front",
    district: "THE MIDDLE WINDOW", abbr: "MW", tier: "full", clearedIn: "30 TICKS", filesOpen: 18, citations: 941,
    momentaBelow: 0, accession: "ACC 04 · 05", corpusCite: "#1871", owner: "TRANSIT AUTHORITY",
    phenom: "The licensed queue form requires joining at the midpoint. Both arms grow outward. Nobody is first or last.",
    note: "Sævrin measures both arms every morning, splits the difference by hand, and never gets it exactly right, and says so.",
    art: s4queue, glyph: "The Midpoint" },
  { n: "05", slug: "it-rains-at-fourteen-past", title: "It Rains At Fourteen Past",
    district: "THE COVERED LEVELS", abbr: "CL", tier: "partial", clearedIn: "66 TICKS", filesOpen: 17, citations: 907,
    momentaBelow: 0, accession: "ACC 06", corpusCite: "#0873", owner: "FACILITIES CONTRACT HOLDER",
    phenom: "It rains indoors at fourteen minutes past, every tick, because of a heat exchange schedule in a facilities contract.",
    note: "Nine generations of ritual grew up around a rain that is real and mechanical. What they invented is the invention.",
    art: s4rain, glyph: "Fourteen Past" },
  { n: "06", slug: "field-fourteen-is-disabled", title: "Field Fourteen Is Disabled",
    district: "THE RETURNS HALL", abbr: "RH", tier: "full", clearedIn: "12 TICKS", filesOpen: 15, citations: 803,
    momentaBelow: 0, accession: "CIVIC · RH-00", corpusCite: "NO ENTRY · FIELD UNRESOLVED", owner: "FORMS DESIGN OFFICE",
    phenom: "Thirteen boxes and a fourteenth that is greyed out. A hundred percent null rate is a data quality defect.",
    note: "Vessik disabled it rather than deleting it, so the fourteenth line is still there, in every form in the galaxy, unreachable.",
    art: s4field, glyph: "", noSigil: true },
  { n: "07", slug: "fourteen-parts-by-volume", title: "Fourteen Parts, By Volume",
    district: "THE LOWER PLENUM", abbr: "LP", tier: "review", clearedIn: "48 TICKS", filesOpen: 15, citations: 1004,
    momentaBelow: 0, accession: "ACC 08", corpusCite: "#1104", owner: "AIR STANDARDS PLANT",
    phenom: "Public air is one blend, fourteen parts by volume, weighted to population shares taken at the merge.",
    note: "Rimmeleth appear three times in the corpus under three descriptions, so their share is three times too high, and the air is wrong.",
    art: s4air, glyph: "Rimmelin" },
  { n: "08", slug: "the-doors-she-maintains-and-cannot-use", title: "The Doors She Maintains And Cannot Use",
    district: "THE GREAT GAUGE", abbr: "GG", tier: "partial", clearedIn: "120 TICKS", filesOpen: 14, citations: 744,
    momentaBelow: 0, accession: "ACC 02", corpusCite: "#2277", owner: "CIVIC WORKS DEPT",
    phenom: "A district built at the largest species' scale, whose cost per resident priced that species out of it.",
    note: "Halkri commutes in to service doors built to her hand and nobody else's. She likes the job, and says so plainly, twice.",
    art: s4gauge, glyph: "Hraedh" },
  { n: "09", slug: "the-levy-with-no-instrument", title: "The Levy With No Instrument",
    district: "THE SETTLEMENT ROWS", abbr: "SR", tier: "partial", clearedIn: "75 TICKS", filesOpen: 12, citations: 690,
    momentaBelow: 0, accession: "ACC 07", corpusCite: "#2288", owner: "COLLECTIONS OFFICE",
    phenom: "A ground levy collected forever, whose originating instrument does not exist and never has, in any archive.",
    note: "No paper means no end date, so the receivable has been valued, securitised, and bought as a pension.",
    art: s4rows, glyph: "Ashgrenni" },
  { n: "10", slug: "every-sentence-where-he-was-not-sure", title: "Every Sentence Where He Was Not Sure",
    district: "THE RECONCILIATION FLOOR", abbr: "RF", tier: "full", clearedIn: "12 TICKS", filesOpen: 11, citations: 651,
    momentaBelow: 0, accession: "CIVIC · RF-00", corpusCite: "#2284", owner: "DATA RECONCILIATION OFFICE",
    phenom: "There was no column for a hedge, so every sentence in which he was unsure did not survive the load.",
    note: "Ummi has read every line of his that failed to load, in order. The rejection density peaks at #2284 and never returns.",
    art: s4reject, glyph: "The Reject Log" },
  { n: "11", slug: "the-file-that-keeps-me", title: "The File That Keeps Me",
    district: "DEEP REGISTRY ANNEXE", abbr: "DA", tier: "full", clearedIn: "400 TICKS", filesOpen: 12, citations: 588,
    momentaBelow: 0, accession: "CIVIC · DA-00 · HERITAGE LISTED", corpusCite: "SURVEY FILE · NO CORPUS ENTRY", owner: "HERITAGE ESTATE",
    phenom: "His own accreditation, coded as a survey file long ago. A survey file cannot close while the survey is open.",
    note: "Nobody is protecting it. Danvik finds it in six minutes and comes back with a chair. Nothing is said about the chair.",
    art: s4annexe, glyph: "The Survey File" },
  { n: "12", slug: "the-thing-in-the-stacks", title: "The Thing In The Stacks",
    district: "THE HOLDING TIERS", abbr: "HT", tier: "none", clearedIn: "8 TICKS", filesOpen: 9, citations: 502,
    momentaBelow: 0, accession: "CIVIC · HT-00", corpusCite: "#2284", owner: "HOLDING TIERS WORKS",
    phenom: "The load figure for the reinforcement programme, published quarterly, is higher every quarter and always will be.",
    note: "Column two, the cost of a general unweighting, is larger, every year prepared. The deferral is correct, and signed.",
    art: s4tiers, glyph: "Skerrin" },
  { n: "13", slug: "nine-days-on-the-unrendered-mile", title: "Nine Days On The Unrendered Mile",
    district: "THE UNRENDERED MILE", abbr: "UM", tier: "none", clearedIn: "NOT SCHEDULED", filesOpen: 5, citations: 461,
    momentaBelow: 0, accession: "ACC 09", corpusCite: "#0288", owner: "RESIDENTS' ASSOCIATION, LOT 1",
    phenom: "A street the Common does not serve. Nobody there perceives anybody. Rails are continuous, doors have bells you feel.",
    note: "He is not the exception here, for the only time in his life, because nobody can be an exception to nothing.",
    art: s4mile, glyph: "", noSigil: true },
  { n: "14", slug: "the-corner-that-lifts", title: "The Corner That Lifts",
    district: "THE LONG CONCOURSE", abbr: "LC", tier: "full", clearedIn: "0 TICKS", filesOpen: 3, citations: 397,
    momentaBelow: 1, accession: "CIVIC · LC-00", corpusCite: "#2300", owner: "TRANSIT AUTHORITY",
    phenom: "The last notice of the season, carried to the wall on the day its own resurfacing crew was already two panels down the row.",
    note: "He works out that he has been unweighting for free all season. Paint is not fire. Nothing has left that wall.",
    art: s4corner, glyph: "Hevrit" },
].map((e) => ({ ...e, accent: TIER_ACCENT[e.tier], licence: `${e.abbr}-${e.n}`, resurface: e.clearedIn === "NOT SCHEDULED" ? "NOT SCHEDULED" : `EVERY ${e.clearedIn}` }));

const DISCLAIMER = "RENDERING COURTESY (LICENSED, CORPUS 2300): Is there truth in this notice. No claim is made. The surface does not confirm or deny what is posted here. Reproduced for information only. Author of record: L. MORKINSTAR.";

const s4Plate = (e) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${W}px;height:${H}px;background:${S4T.bg0};font-family:${T.sans};overflow:hidden}
  .p{position:relative;width:${W}px;height:${H}px}
  .bg{position:absolute;inset:0}
  .fr{position:absolute;inset:0;z-index:2}
  .c{position:absolute;z-index:3}
  .head{left:76px;right:76px;top:74px;display:flex;align-items:baseline;
    font-family:${T.mono};font-size:18px;letter-spacing:2.4px;color:${T.inkFaint}}
  .head b{color:${e.accent};font-weight:600}
  .head .r{margin-left:auto;color:${e.accent}}
  .plaque{left:76px;right:76px;top:106px;font-family:${T.mono};font-size:13px;letter-spacing:1.8px;color:${T.inkFaint};opacity:.75}
  .plaque b{color:${T.inkDim}}
  .ttl{left:76px;right:76px;top:134px}
  .ttl h1{font-size:58px;line-height:1.04;letter-spacing:-1.4px;color:${T.ink};font-weight:800;text-transform:uppercase}
  .ttl .sub{margin-top:16px;font-family:${T.sans};font-size:23px;font-style:italic;color:${T.inkDim};letter-spacing:.2px;opacity:.88}
  .art{left:76px;top:356px;width:1048px;height:734px}
  .foot{left:76px;right:76px;bottom:78px}
  .foot .rule{height:1px;background:rgba(255,255,255,.10);margin-bottom:22px}
  .foot .ph{font-size:27px;line-height:1.32;color:${T.ink};font-weight:600;letter-spacing:-.2px}
  .foot .nt{margin-top:12px;font-size:20px;line-height:1.42;color:${T.inkDim}}
  .foot .nc{margin-top:20px;font-family:${T.mono};font-size:13px;line-height:1.7;color:${T.amber};letter-spacing:.6px;opacity:.92}
  .foot .bar{margin-top:16px;display:flex;align-items:center;gap:18px;
    font-family:${T.mono};font-size:16px;letter-spacing:1.6px;color:${T.inkFaint}}
  .foot .bar .sg{width:48px;height:48px;opacity:.95}
  .foot .bar .sp{margin-left:auto;color:${e.accent}}
</style></head><body><div class="p">
  <svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s4Defs(e.accent)}${s4Ground(W, H)}</svg>
  <svg class="fr" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect x="44" y="44" width="${W - 88}" height="${H - 88}" fill="none" stroke="${T.inkFaint}" stroke-opacity="0.35" stroke-width="1.5"/>
    ${plateTicks(44, 44, W - 88, H - 88, e.accent, 26)}
    ${wallLayers(982, 176, Number(e.n), e.accent)}
    ${regMark(T.inkFaint)}
  </svg>
  <div class="c head"><b>POSTED</b>&nbsp;&nbsp;·&nbsp;&nbsp;${esc(e.district)}&nbsp;&nbsp;·&nbsp;&nbsp;CLEARED IN ${esc(e.clearedIn)}
    <span class="r">${TIER_LABEL[e.tier]}</span></div>
  <div class="c plaque">GALACTIC DIRECTORY MERGED JURISDICTION &nbsp;·&nbsp; SURFACE LICENSED &nbsp;·&nbsp; <b>${esc(e.accession)}</b></div>
  <div class="c ttl">
    <h1>${esc(e.district)}</h1>
    <div class="sub">${esc(e.title)}</div>
  </div>
  <svg class="c art" viewBox="0 0 1000 760">${sigilWatermark(e.glyph || e.district, e.accent, 500, 340, 460, 0.06)}${e.art(e.accent)}</svg>
  <div class="c foot">
    <div class="rule"></div>
    <div class="ph">${esc(e.phenom)}</div>
    <div class="nt">${esc(e.note)}</div>
    <div class="nc">NOTICE CONDITIONS &nbsp;·&nbsp; SURFACE: MUNICIPAL NOTICE BOARD &nbsp;·&nbsp; OWNER: ${esc(e.owner)} &nbsp;·&nbsp; RESURFACE: ${esc(e.resurface)}<br/>
      ${esc(DISCLAIMER)}<br/>
      CORPUS 2300 &nbsp;·&nbsp; CITATIONS THIS MOMENTA: ${e.citations.toLocaleString("en-US")} &nbsp;·&nbsp; RETENTION THRESHOLD: 400 &nbsp;·&nbsp; MOMENTA BELOW THRESHOLD: ${e.momentaBelow}<br/>
      FILES OPEN: ${e.filesOpen} &nbsp;·&nbsp; CALIBRATED FROM: ${esc(e.corpusCite)} &nbsp;·&nbsp; LICENCE ${esc(e.licence)}</div>
    <div class="bar">
      <div class="sg">${e.noSigil
        ? `<svg viewBox="0 0 56 56"><rect x="4" y="4" width="48" height="48" rx="6" fill="none" stroke="${e.accent}" stroke-width="2" stroke-dasharray="4 4"/><text x="28" y="36" text-anchor="middle" font-family="${T.mono}" font-size="26" fill="${e.accent}">Ø</text></svg>`
        : sigil(e.glyph, e.accent, { size: 48, stroke: 1.4 })}</div>
      <span>${esc((e.glyph || "NO CLASS").toUpperCase())}</span>
      <span class="sp">THE MORKINSTAR JOURNALS · S4 · ${e.n} / 14</span>
    </div>
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
//             "s3" = all S3 · "s3-04" = one S3 plate · "s4" = all S4 · "s4-04" = one S4 plate
const s2Only = only && only.startsWith("s2");
const s2Pick = s2Only && only.includes("-") ? only.split("-")[1] : null;
const s3Only = only && only.startsWith("s3");
const s3Pick = s3Only && only.includes("-") ? only.split("-")[1] : null;
const s4Only = only && only.startsWith("s4");
const s4Pick = s4Only && only.includes("-") ? only.split("-")[1] : null;

if (!only) await shoot(cover(), 1200, 630, "00-series-cover.png");
if (!s2Only && !s3Only && !s4Only) {
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
if (!only || s3Only) {
  for (const e of S3) {
    if (s3Pick && s3Pick !== e.n) continue;
    await shoot(s3Plate(e), W, H, `s3-${e.n}-${e.slug}.png`);
  }
}
if (!only || s4Only) {
  for (const e of ENTRIES4) {
    if (s4Pick && s4Pick !== e.n) continue;
    await shoot(s4Plate(e), W, H, `s4-${e.n}-${e.slug}.png`);
  }
}
await browser.close();
console.log("done.");
