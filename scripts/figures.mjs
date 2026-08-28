#!/usr/bin/env node
// Place a lesson's own carousel art inside the article, at the beats it argues.
//
//   node scripts/figures.mjs                     # every lesson
//   node scripts/figures.mjs lessons/<dir>       # one
//   node scripts/figures.mjs --dry-run           # say what it would do
//   node scripts/figures.mjs --strip             # remove managed figures again
//
// WHY. Every lesson already ships a cover card and a five-to-eight slide
// carousel, each one bespoke, on-brand and about that specific bug — a
// before/after Kotlin snippet, a diagram of the mechanism, the cast portrait.
// All of it was built for LinkedIn. Inside the dev.to article it appeared
// nowhere: seventeen posts, one cover each, then wall-to-wall text. The
// plumbing to carry it across already existed (export.mjs rewrites relative
// `assets/` paths to absolute raw URLs, and its comment says that exists so
// "the carousel art actually reaches dev.to") and nothing used it.
//
// So this is not new art. It is the art that was already made, put where a
// reader is when they need it.
//
// WHY NOT GENERATED ART. These are engineering lessons where the visual IS
// information: "a plain List is unstable" is a claim a code slide can make and
// an illustration cannot. Decorative raster art next to a real before/after
// snippet reads as filler, and would cost money to make the piece worse.
//
// WHY IT WRITES INTO lesson.md. That file is the source of truth: it renders
// on GitHub, it is what a human reviews, and export.mjs already absolutises
// its asset paths on the way out. Injecting at export time instead would mean
// the figures exist only on platforms nobody can diff.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DRY = process.argv.includes("--dry-run");
const STRIP = process.argv.includes("--strip");
const only = process.argv.slice(2).find((a) => !a.startsWith("--"));

/** Fenced so a re-run replaces rather than duplicates, and `--strip` can undo
 *  the whole thing without touching a word of the prose. */
const OPEN = "<!-- figures:start -->";
const CLOSE = "<!-- figures:end -->";

/**
 * Which slide belongs under which heading, and why.
 *
 * Both sides of this are stable across all seventeen lessons — the carousel
 * generator emits the same slide `type`s and the lesson template uses the same
 * headings — so the mapping is a lookup, not a guess. A lesson missing a type
 * simply gets no figure at that beat rather than a wrong one.
 */
const PLACEMENT = [
  // The antagonist, introduced where the hook names the symptom.
  { heading: "## The hook", types: ["character"] },
  // The mechanism, where the insight explains it. A diagram if the lesson drew
  // one, otherwise the before/after code, which makes the same point in the
  // reader's own language.
  { heading: "## The insight", types: ["diagram", "code"] },
  // The remedy, at the end of the narrative and before the summary.
  { heading: "## The story / how it played out", types: ["fixes"] },
  // The line worth remembering, beside the takeaway itself.
  { heading: "## The takeaway", types: ["takeaway"] },
];

/** Alt text from the slide's own words — never "image" or "figure". */
function altFor(slide) {
  const head = (Array.isArray(slide.head) ? slide.head : [slide.head])
    .filter(Boolean).map((s) => String(s).replace(/^\*/, "")).join(" ");
  const caption = typeof slide.caption === "string" ? slide.caption : "";
  const kicker = typeof slide.kicker === "string" ? slide.kicker : "";
  // A COLON, never an em dash. The house voice rule forbids em dashes in
  // published writing and lint-voice.mjs enforces it — joining kicker and head
  // with one flagged all seventeen lessons the moment figures landed, which is
  // the gate doing exactly its job on generated text nobody had proofread.
  const text = [kicker, head].filter(Boolean).join(": ") || caption || "Slide";
  // One line, no markdown-breaking characters.
  return text
    .replace(/\s*[—–]\s*/g, ", ")   // no em/en dashes: house voice rule
    .replace(/\s+/g, " ")
    .replace(/[[\]()]/g, "")
    .trim()
    .slice(0, 160);
}

function figuresFor(dir) {
  const metaPath = join(dir, "assets", "carousel.json");
  const slidesDir = join(dir, "assets", "carousel");
  if (!existsSync(metaPath) || !existsSync(slidesDir)) return [];
  const slides = JSON.parse(readFileSync(metaPath, "utf8")).slides ?? [];
  const files = readdirSync(slidesDir).filter((f) => /^slide-\d+\.png$/.test(f)).sort();
  if (slides.length !== files.length) return [];

  const used = new Set();
  const out = [];
  for (const { heading, types } of PLACEMENT) {
    // First matching type wins, and a slide is never placed twice.
    const idx = slides.findIndex((s, i) => types.includes(s.type) && !used.has(i));
    if (idx < 0) continue;
    used.add(idx);
    out.push({ heading, file: `assets/carousel/${files[idx]}`, alt: altFor(slides[idx]) });
  }
  return out;
}

/**
 * Remove any previously managed figure block, leaving the prose byte-identical
 * to what it was before.
 *
 * Every surrounding newline is collapsed back to a single one, not just the
 * one either side. Inserting adds a blank line above and below (CommonMark
 * needs them, and these lessons write prose flush against the heading with no
 * blank line at all), so stripping one newline per side left two blank lines
 * behind and `--strip` did not actually restore the file.
 */
const strip = (md) =>
  md.replace(new RegExp(`\\n*${OPEN}[\\s\\S]*?${CLOSE}\\n*`, "g"), "\n");

function apply(md, figures) {
  let out = strip(md);
  for (const f of figures) {
    const at = out.indexOf(f.heading);
    if (at < 0) continue;
    // Insert after the heading line and the blank line that follows it, so the
    // figure sits under its heading rather than splitting a paragraph.
    const lineEnd = out.indexOf("\n", at);
    if (lineEnd < 0) continue;
    // Blank lines on BOTH sides are load-bearing, not cosmetic. A CommonMark
    // HTML block runs until a blank line, so `<!-- figures:end -->` followed
    // directly by prose swallows that paragraph into the comment block and it
    // renders as nothing. The rest is trimmed of leading newlines so repeated
    // runs cannot stack blank lines.
    const rest = out.slice(lineEnd + 1).replace(/^\n+/, "");
    const block = `\n\n${OPEN}\n![${f.alt}](${f.file})\n${CLOSE}\n\n`;
    out = out.slice(0, lineEnd) + block + rest;
  }
  return out;
}

const dirs = only
  ? [only.replace(/\/$/, "")]
  : readdirSync(join(ROOT, "lessons"))
      .filter((d) => /^\d{4}-\d{2}-\d{2}-/.test(d))
      .sort()
      .map((d) => join("lessons", d));

let changed = 0;
for (const rel of dirs) {
  const dir = join(ROOT, rel);
  const mdPath = join(dir, "lesson.md");
  if (!existsSync(mdPath)) continue;
  const md = readFileSync(mdPath, "utf8");

  if (STRIP) {
    const next = strip(md);
    if (next !== md) { if (!DRY) writeFileSync(mdPath, next); changed++; console.log(`  stripped ${basename(dir)}`); }
    continue;
  }

  const figures = figuresFor(dir);
  if (!figures.length) { console.log(`  ${basename(dir)}: no placeable slides`); continue; }
  const next = apply(md, figures);
  if (next === md) { console.log(`  ${basename(dir)}: already current (${figures.length})`); continue; }
  if (!DRY) writeFileSync(mdPath, next);
  changed++;
  console.log(`  ${DRY ? "would place" : "placed"} ${figures.length} in ${basename(dir)}: ${figures.map((f) => basename(f.file)).join(", ")}`);
}

console.log(`\n${DRY ? "dry run: " : ""}${changed} lesson(s) ${STRIP ? "stripped" : "updated"}.`);
