#!/usr/bin/env node
// The Morkinstar Journals — the art layer that is not a diagram.
//
//   node scripts/morkinstar-art.mjs
//
// The field plates draw MECHANISM. This file draws the things the anthology
// treats as objects: a sigil per entry, the mark that has no sound, and the
// bestiary of the fourteen with its fourteenth slot left empty.
//
// Almost none of this is new code. sigil() already exists in design-kit.mjs and
// already derives its geometry from the bytes of a name, which is exactly the
// property this anthology cares about: rename the thing and the mark changes,
// because the mark was never the thing's, it belonged to the name.
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { sigil, defs, ground, plateTicks, T, esc } from "./design-kit.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIC = join(ROOT, "fiction/morkinstar-journals");
const OUT = join(FIC, "assets");
const SIG = join(OUT, "sigils");

// Every entry's sigil is hashed from the thing that entry is ABOUT, not from its
// title. Two entries about the same Power would produce the same mark, which is
// the correct behaviour and the reason the pantheon rule works at all.

// Two entries have no mark, and the absence is the entry. Season four's plates
// already draw them this way (`noSigil` in morkinstar-plates.mjs): a keyline at
// exactly the size of the other marks, so the absence has dimensions and a
// reader can measure it. Emitting nothing would make the absence measureless,
// which is a different and weaker thing.
const BLANK = Symbol("no mark");
const blankSigil = (accent) =>
  `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="no mark">
  <rect x="12" y="12" width="136" height="136" rx="16" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="11 11"/>
  <text x="80" y="102" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="72" fill="${accent}">Ø</text>
</svg>\n`;

const GLYPHS = [
  ["s1-01", "K'öæluæ"], ["s1-02", "Uhl"], ["s1-03", "Ottokh"], ["s1-04", "Hælvren"],
  ["s1-05", "Grin"], ["s1-06", "Skalde"], ["s1-07", "Skerrin"], ["s1-08", "Hœl"],
  ["s1-09", "Concluded"], ["s1-10", "Done"],
  ["s2-01", "The Case"], ["s2-02", "Emmerin"], ["s2-03", "The Kest"], ["s2-04", "Hallovar"],
  ["s2-05", "The Ovai"], ["s2-06", "The Weight"], ["s2-07", "The Bearing"],
  ["s2-08", "The Vedrei"], ["s2-09", "Skerrin"], ["s2-10", "Vænheim"],
  // Season three burns the case, so a page's mark is the mark of whatever is on
  // the page, not of the fire. Five of these repeat a season two string on
  // purpose: it is the same Power, seen twice, and the rule says the mark is
  // the same. s3-12 also repeats s2-09, because the page where he works it out
  // is a page about the same thing the correcting hand was about.
  ["s3-01", "Ossul"], ["s3-02", "Sölrun"], ["s3-03", "Hallovar"], ["s3-04", "The Ovai"],
  ["s3-05", "The Fish"], ["s3-06", "The Weight"], ["s3-07", "Mörk"], ["s3-08", "The Vedrei"],
  ["s3-09", "Yska"], ["s3-10", "The Bearing"], ["s3-11", "Ræl · Tuvid"], ["s3-12", "Skerrin"],
  ["s3-13", "The Unnamed"], ["s3-14", "Kept"],
  // Season four is a city, so the thing an entry is about is a district's
  // mechanism rather than a world's Power. s4-12 is Skerrin again, for the
  // fourth time in the anthology: the record has a weight there too.
  ["s4-01", "Gate Fourteen"], ["s4-02", "Ondrit"], ["s4-03", "Ombri"], ["s4-04", "The Midpoint"],
  ["s4-05", "Fourteen Past"], ["s4-06", BLANK], ["s4-07", "Rimmelin"], ["s4-08", "Hraedh"],
  ["s4-09", "Ashgrenni"], ["s4-10", "The Reject Log"], ["s4-11", "The Survey File"],
  ["s4-12", "Skerrin"], ["s4-13", BLANK], ["s4-14", "Hevrit"],
  // The Dark Directory. What a retrieval file is about is the holding, or the
  // thing the form has no field for. dd-04 is "Concluded", the same string as
  // s1-09 and therefore the same mark, because it is the same thing: one entry
  // asks what a Concluded world is and the other asks what the word means.
  ["dd-01", "Möndri"], ["dd-02", "The Span"], ["dd-03", "The Residual Interval"],
  ["dd-04", "Concluded"], ["dd-05", "The Standard Bond Radius"], ["dd-06", "Found In Collection"],
  ["dd-07", "The Withdrawal"], ["dd-08", "The Finding Aid"], ["dd-09", "The Arrangement Statement"],
  ["dd-10", "Class Not Assigned"],
];

// One per season, and each is the accent that season already owns: s1 and s2
// from the plates, s3 and s4 from seasonTheme.ts, where season three swaps
// --color-accent to --color-warn and season four swaps it to --color-coverage.
// The Dark Directory has exactly one colour and this is it: the stamp ink.
const ACCENT = {
  s1: "#8FD3FF", s2: "#8A5A28", s3: "#F0883E", s4: "#5EC8DC", dd: "#6B3FA0",
};

mkdirSync(SIG, { recursive: true });

// ── 1. a sigil per entry, animated ──────────────────────────────────────────
// animate:true makes each stroke draw itself in document order, outside in,
// which is also the order you read a mark. On the site these sit beside the
// title and draw once on reveal.
for (const [key, glyph] of GLYPHS) {
  const accent = ACCENT[key.slice(0, 2)];
  if (!accent) throw new Error(`${key}: no accent for season ${key.slice(0, 2)}`);
  const svg = glyph === BLANK
    ? blankSigil(accent)
    : sigil(glyph, accent, { size: 160, stroke: 1.9, animate: true, duration: 2.4 });
  writeFileSync(join(SIG, `${key}.svg`), svg);
}
console.log(`  sigils: ${GLYPHS.length} → assets/sigils/`);

// ── 2. the mark ─────────────────────────────────────────────────────────────
// Tveggi's scratch, from Entry #2250. A name with no sound, which is why a mouth
// with no hands could never reach it. The site uses it as the section divider,
// so the thing separating the parts of a story is the object that made writing
// possible in the first place.
writeFileSync(
  join(OUT, "mark.svg"),
  `<svg viewBox="0 0 24 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="the mark">
  <line x1="12" y1="6" x2="12" y2="90" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
</svg>\n`,
);
console.log("  mark.svg");

// ── 3. the bestiary of the fourteen ─────────────────────────────────────────
// Thirteen marks and an empty slot. This is the whole anthology as one image and
// it should be the thing somebody screenshots. The blank is not a placeholder to
// fill in later; it is the subject.
const NAMED_THIRTEEN = [
  "Xærion", "Uhl", "Ottokh", "Vaal-Ne", "Grin", "Skalde", "Skerrin",
  "Hœl", "Ihn-Solat", "Vör-Angi", "Ösrun", "Ombra", "Anh-Rekk",
];

function bestiary() {
  const W = 1200, H = 1560, a = T.amber;
  let cells = "";
  const cols = 4, cw = 250, ch = 250, x0 = 110, y0 = 430;
  for (let i = 0; i < 14; i++) {
    const cx = x0 + (i % cols) * cw, cy = y0 + Math.floor(i / cols) * ch;
    const blank = i === 13;
    cells += `<g transform="translate(${cx},${cy})">`;
    cells += `<rect x="0" y="0" width="200" height="200" rx="10" fill="none" stroke="${blank ? T.danger : T.line}" stroke-opacity="${blank ? 0.55 : 1}" stroke-width="${blank ? 2 : 1.4}"${blank ? ' stroke-dasharray="6 8"' : ""}/>`;
    if (!blank) {
      cells += `<g transform="translate(30,26) scale(0.85)">${sigil(NAMED_THIRTEEN[i], a, { size: 160, stroke: 1.7 }).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`;
      cells += `<text x="100" y="228" text-anchor="middle" font-family="${T.mono}" font-size="15" fill="${T.inkDim}" letter-spacing="1.4">${esc(NAMED_THIRTEEN[i])}</text>`;
    } else {
      cells += `<text x="100" y="106" text-anchor="middle" font-family="${T.mono}" font-size="15" fill="${T.danger}" fill-opacity="0.75" letter-spacing="1.6">NO NAME</text>`;
      cells += `<text x="100" y="228" text-anchor="middle" font-family="${T.mono}" font-size="15" fill="${T.danger}" letter-spacing="1.4">XIV</text>`;
    }
    cells += `</g>`;
  }

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${W}px;height:${H}px;background:${T.bg0};font-family:${T.sans};overflow:hidden}
    .p{position:relative;width:${W}px;height:${H}px}
    .c{position:absolute;z-index:3}
    .head{left:110px;right:76px;top:80px;font-family:${T.mono};font-size:19px;
      letter-spacing:2.6px;color:${T.inkFaint}}
    .head b{color:${T.amber};font-weight:600}
    .ttl{left:110px;right:76px;top:132px}
    .ttl h1{font-size:78px;line-height:1;letter-spacing:-2.4px;color:${T.ink};font-weight:700}
    .ttl p{margin-top:22px;font-size:23px;line-height:1.42;color:${T.inkDim};max-width:56ch}
    .foot{left:110px;right:76px;bottom:80px;font-family:${T.mono};font-size:17px;
      letter-spacing:1.6px;color:${T.inkFaint};display:flex}
    .foot .r{margin-left:auto;color:${T.danger}}
  </style></head><body><div class="p">
    <svg class="c" style="inset:0" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      ${defs(T.amber)}${ground(W, H)}
      <rect x="44" y="44" width="${W - 88}" height="${H - 88}" fill="none" stroke="${T.line}" stroke-width="1.5"/>
      ${plateTicks(44, 44, W - 88, H - 88, T.amber, 34)}
      ${cells}
    </svg>
    <div class="c head"><b>GALACTIC DIRECTORY</b>&nbsp;&nbsp;·&nbsp;&nbsp;THE FOURTEEN&nbsp;&nbsp;·&nbsp;&nbsp;COMPILED FROM EIGHT WORLDS</div>
    <div class="c ttl"><h1>Thirteen names.</h1>
      <p>Every world reports fourteen. Ask anyone to list them and you get thirteen and a pause.
        The pause is the most consistent phenomenon in this series.</p></div>
    <div class="c foot"><span>THE MORKINSTAR JOURNALS</span>
      <span class="r">THE FOURTEENTH LINE IS A CROSS-REFERENCE</span></div>
  </div></body></html>`;
}

const browser = await chromium.launch();
async function shoot(html, w, h, file) {
  const tab = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await tab.setContent(html, { waitUntil: "load" });
  writeFileSync(join(OUT, file), await tab.screenshot({ type: "png" }));
  await tab.close();
  const wt = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 0.5 });
  await wt.setContent(html, { waitUntil: "load" });
  mkdirSync(join(OUT, "web"), { recursive: true });
  writeFileSync(join(OUT, "web", file.replace(/\.png$/, ".jpg")), await wt.screenshot({ type: "jpeg", quality: 78 }));
  await wt.close();
  console.log(`  ${file}  (${w}x${h})  +web`);
}

await shoot(bestiary(), 1200, 1560, "the-fourteen.png");
await browser.close();
console.log("done.");
