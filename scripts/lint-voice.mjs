#!/usr/bin/env node
// Catches em dashes and AI-tell phrases in a lesson's human-facing copy.
// Zero flags before a post ships. See voice/voice-profile.md.
//
//   node scripts/lint-voice.mjs lessons/<dir>        # lint one lesson's linkedin.md + article.md + lesson.md
//   node scripts/lint-voice.mjs <file.md>            # lint a single file
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const target = process.argv[2];
if (!target) { console.error("usage: node scripts/lint-voice.mjs <lesson-dir|file>"); process.exit(2); }

// files to check when given a lesson dir (skip machine files: meta.yaml, assets, out)
const FILES = ["linkedin.md", "article.md", "lesson.md"];
const isDir = existsSync(target) && statSync(target).isDirectory();
const files = isDir ? FILES.map((f) => resolve(target, f)).filter(existsSync) : [resolve(target)];

// Hard fails
const HARD = [
  { re: /—/g, msg: "em dash (—) — use a full stop, comma, colon, or parentheses" },
  { re: /(\d)\s*–\s*(\d)/g, msg: "en dash in a number range — use 'to' or a plain hyphen" },
  { re: /–/g, msg: "en dash (–)" },
  { re: /\b(is|are|was|were|isn't|aren't|it's)\s+not\s+(just\s+)?(a|an|about)\b[^.?!]*\bit'?s\b/gi, msg: "\"it's not X, it's Y\" construction — reframe as an image, not a negation" },
];
// Phrase tells (case-insensitive, word-ish boundaries)
const PHRASES = [
  "here's the thing", "at the end of the day", "when it comes to", "in today's world",
  "in today's fast-paced", "let's dive in", "let's dive into", "dive into", "delve",
  "game-changer", "game changer", "testament to", "underscores", "underscore the",
  "in the realm of", "needless to say", "it's worth noting", "that said,", "seamless",
  "robust solution", "unlock the", "elevate your", "supercharge", "navigate the landscape",
  "the fact that", "in conclusion", "moreover", "furthermore", "look no further",
  "buckle up", "without further ado", "rest assured", "a myriad of", "plethora",
];

let flags = 0;
const strip = (t) => t.replace(/^---\n[\s\S]*?\n---\n/, "").replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, ""); // drop frontmatter + code

for (const file of files) {
  const raw = readFileSync(file, "utf8");
  const text = strip(raw);
  const lines = text.split("\n");
  const hits = [];
  lines.forEach((line, i) => {
    for (const h of HARD) { h.re.lastIndex = 0; if (h.re.test(line)) hits.push({ n: i + 1, msg: h.msg, snip: line.trim().slice(0, 80) }); }
    const low = line.toLowerCase();
    for (const p of PHRASES) if (low.includes(p)) hits.push({ n: i + 1, msg: `banned phrase: "${p}"`, snip: line.trim().slice(0, 80) });
  });
  const name = file.split("/").slice(-2).join("/");
  if (hits.length) {
    flags += hits.length;
    console.log(`\n  ✗ ${name}`);
    for (const h of hits) console.log(`    L${h.n}  ${h.msg}\n         "${h.snip}"`);
  } else {
    console.log(`  ✓ ${name}`);
  }
}
console.log(flags ? `\n  ${flags} flag(s). Fix before shipping.\n` : `\n  clean — sounds human. ✅\n`);
process.exit(flags ? 1 : 0);
