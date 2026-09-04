#!/usr/bin/env node
// Catches em dashes, AI-tell phrases and pipeline residue in human-facing copy.
// Zero flags before a post ships. See voice/voice-profile.md.
//
//   node scripts/lint-voice.mjs lessons/<dir>        # lint one lesson's linkedin.md + article.md + lesson.md
//   node scripts/lint-voice.mjs fiction/<dir>        # lint every numbered entry in a fiction directory
//   node scripts/lint-voice.mjs <file.md>            # lint a single file
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const target = process.argv[2];
if (!target) { console.error("usage: node scripts/lint-voice.mjs <lesson-dir|fiction-dir|file>"); process.exit(2); }

// files to check when given a lesson dir (skip machine files: meta.yaml, assets, out)
const FILES = ["linkedin.md", "article.md", "lesson.md"];
const isDir = existsSync(target) && statSync(target).isDirectory();
const lessonFiles = isDir ? FILES.map((f) => resolve(target, f)).filter(existsSync) : [];

// A directory that is not a lesson (no linkedin.md/article.md/lesson.md) is
// linted generally: every numbered entry directly inside it. This is how
// fiction/morkinstar-journals gets covered without a second hardcoded file
// list, and it was never run before now, so no published entry has ever been
// linted for anything.
//
// The filter is a PREFIX ALLOW-LIST, not "every .md": a fiction directory also
// holds bible.md, the council/audit records and README.md, and those are
// working files, not published prose — bible.md and leak-doctrine.md say so
// themselves (they are precisely the .md files a reader must never reach).
// leak-doctrine.md in particular DISCUSSES the residue tag below in plain
// prose, so linting it here would flag the guard's own documentation instead
// of the thing the guard is for.
const genericFiles =
  isDir && lessonFiles.length === 0
    ? readdirSync(target)
        //
        // `dd-` is in here because it was NOT, and that is the most expensive
        // kind of bug this repo produces. The pattern was `^(?:s\d+-)?\d+-`,
        // which matches `02-`, `s4-01-` and nothing else. A whole sibling
        // season shipped as `dd-01-` through `dd-10-`, and the directory run
        // linted 47 files, could not see the other ten, and printed "clean,
        // sounds human" over a season it had never opened. Green, and proving
        // nothing.
        //
        // So the rule when a series adds a prefix is: add it HERE, in the same
        // change, or the gate silently stops covering it. lintVoiceScope.test.mjs
        // holds the pattern against the directory's actual contents so the next
        // prefix cannot arrive unnoticed.
        .filter((f) => f.endsWith(".md") && /^(?:s\d+-|dd-)?\d+-|^pilot-/.test(f))
        .sort()
        .map((f) => resolve(target, f))
    : [];

const files = isDir ? [...lessonFiles, ...genericFiles] : [resolve(target)];

// A directory that resolves to zero files is not "clean", it is a walker
// that stopped reading — a renamed entry-numbering convention, a typo'd
// path, or a lesson dir mid-scaffold with none of its three files written
// yet. Reporting "clean" with nothing checked is the exact failure this
// project keeps hitting, so this is a config error, not a pass.
if (isDir && files.length === 0) {
  console.error(`no files matched in ${target} (expected linkedin.md/article.md/lesson.md, or *.md named like "02-..." / "s2-01-...")`);
  process.exit(2);
}

// Hard fails
const HARD = [
  { re: /—/g, msg: "em dash (—) — use a full stop, comma, colon, or parentheses" },
  { re: /(\d)\s*–\s*(\d)/g, msg: "en dash in a number range — use 'to' or a plain hyphen" },
  { re: /–/g, msg: "en dash (–)" },
  { re: /\b(?:(?:is|are|was|were)\s+not|(?:is|are|was|were)n['’]?t)\s+(?:just\s+)?(?:a|an)\b[^.?!]{0,50}?\bit(?:['’]s|\s+is)\s+(?:a|an|the)\b/gi, msg: "\"isn't a X, it's a Y\" construction — reframe as an image, not a negation" },
  // Guard A's own vocabulary (see cv-siddharth's src/data/proseGuards.ts): a
  // generator tag that ends up in published prose because nobody said it.
  // s3-09 shipped `</content>` for weeks this way. Deliberately narrower than
  // proseGuards.ts's RESIDUE: no bare `^---$`/`^```$` line check, because this
  // corpus's entries legitimately end their story on a `---` divider before
  // the Terminologies block, and that divider would flag on every entry.
  { re: /<\/?(content|document|response|thinking|antml[^>]*)>/g, msg: "pipeline residue tag — a generator artifact, not something anyone said" },
];
// Phrase tells (case-insensitive, word-ish boundaries)
const PHRASES = [
  // Uncontracted variants matter: this voice avoids contractions on purpose, so
  // "here is the thing" walked straight past the apostrophe form for two posts.
  "here's the thing", "here is the thing", "it is worth noting", "that being said",
  "at the end of the day", "when it comes to", "in today's world",
  "in today's fast-paced", "let's dive in", "let's dive into", "dive into", "delve",
  "game-changer", "game changer", "testament to", "underscores", "underscore the",
  "in the realm of", "needless to say", "it's worth noting", "that said,", "seamless",
  "robust solution", "unlock the", "elevate your", "supercharge", "navigate the landscape",
  "the fact that", "in conclusion", "moreover", "furthermore", "look no further",
  "buckle up", "without further ado", "rest assured", "a myriad of", "plethora",
];

let flags = 0;
let advisories = 0;

// VOICE SIGNALS -- the judgment tier (voice/VOICE-MEASURED.md, gate one, 2026-09-02).
//
// The checks above are the MECHANICAL tier: a dash is in the string or it is not. They were the
// only thing this linter ever checked, and they pass at 0.00 em dashes across 50,144 words of
// lessons -- while the four signals that actually make the writing his collapsed against the
// 2011-21 archive: contractions 23.19 -> 1.89 per 1k, first person 20.23 -> 4.09, questions
// 8.70 -> 1.48, hedging 8.28 -> 2.53. A clean run reported "sounds human" through all of it.
//
// Thresholds are read off the corpus, never guessed. Per file at 200+ words the medians are
// contractions 1.0, I 2.9, hedge 0.0, parentheticals 4.2. A rule at "2 or more signals at zero"
// flags 29 of 51 files: accurate, and useless as a gate, because a warning that fires on 57% of
// a corpus gets ignored along with the rest. At "all four at zero" it flags 6 -- files with no
// voice in them at all. That is the floor, it is advisory, and it never sets the exit code:
// whether a sentence needs a contraction is a judgment a script cannot make.
const SIGNALS = [
  ["contractions", /\b\w+['\u2019](s|t|re|ve|ll|d|m)\b/g],
  ["I", /\bI\b/g],
  ["hedging", /\b(i think|probably|maybe|kinda|not sure|roughly|might)\b/gi],
  ["parentheticals", /\(/g],
];

function voiceSignals(text) {
  const words = (text.match(/[A-Za-z][A-Za-z'-]*/g) || []).length;
  if (words < 200) return null;
  const rates = SIGNALS.map(([name, re]) => [name, ((text.match(re) || []).length * 1000) / words]);
  return { words, rates, zeros: rates.filter(([, r]) => r === 0).map(([n]) => n) };
}

const strip = (t) => t.replace(/^---\n[\s\S]*?\n---\n/, "").replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, ""); // drop frontmatter + code

for (const file of files) {
  const isFiction = /\/fiction\//.test(file);
  const raw = readFileSync(file, "utf8");
  const text = strip(raw);
  const lines = text.split("\n");
  const hits = [];
  lines.forEach((line, i) => {
    // The dash rule is about BODY PROSE and always was. Every entry ends on a
    // Terminologies block whose entries read `- **Click** - Equivalent to 1
    // Hellheim`, and the 2021 original that the house rule was written from
    // already had exactly that. A glossary definition and a table cell using a
    // dash as an empty-cell marker are not prose, and running the check over
    // them flags 99 lines of correct canon formatting across the published
    // entries. Rewriting those to satisfy the linter would be the linter
    // rewriting the fiction.
    //
    // Scoped rather than deleted: a dash in a real sentence still fails, which
    // is the thing the rule exists for.
    const isGlossary = /^\s*(?:>\s*)?(?:[-*]\s+)?\*\*[^*]+\*\*\s*[\u2014\u2013]/.test(line);
    const isTableRow = /^\s*\|/.test(line);
    for (const h of HARD) {
      const dashRule = h.msg.startsWith("em dash") || h.msg.startsWith("en dash");
      if (dashRule && (isGlossary || isTableRow)) continue;
      // "isn't a X, it's a Y" is padding when an engineer writes it and
      // antithesis when a storyteller does. The s2 bible's own load-bearing
      // line is "an archive of one author is not an archive, it is a
      // self-portrait, and Skerrin eats those", quoted in the entry this fired
      // on, so the rule as written flags the canon it is supposed to protect.
      // Off for fiction, kept for the lessons, where it was earning its keep.
      if (isFiction && h.msg.startsWith('"isn\'t a X')) continue;
      h.re.lastIndex = 0;
      if (h.re.test(line)) hits.push({ n: i + 1, msg: h.msg, snip: line.trim().slice(0, 80) });
    }
    // PHRASES is a drafting aid for the technical lessons, where "the fact
    // that" and "here is the thing" are padding an engineer should cut. In the
    // fiction they are the voice: the correspondent is loose, digressive and
    // chatty by design, opens on "Greetings again, my dear readers", and the
    // bible calls the parenthetical asides the asset. Running the list over
    // published entries flags eight lines of him sounding like himself.
    //
    // So the fiction gets the HARD rules only. Those are correctness: a
    // pipeline tag is never something anyone said, and a dash in a real
    // sentence still fails. Taste stays with the lessons.
    if (!isFiction) {
      const low = line.toLowerCase();
      for (const p of PHRASES) if (low.includes(p)) hits.push({ n: i + 1, msg: `banned phrase: "${p}"`, snip: line.trim().slice(0, 80) });
    }
  });
  const name = file.split("/").slice(-2).join("/");
  const sig = isFiction ? null : voiceSignals(text);
  if (sig && sig.zeros.length === SIGNALS.length) {
    advisories++;
    console.log(`\n  ~ ${name}  VOICE FLOOR: no contractions, no "I", no hedging, no asides in ${sig.words} words`);
    console.log(`      judgment tier, not a blocker. The archive runs 23.19 contractions and 20.23 "I" per 1k.`);
  }
  if (hits.length) {
    flags += hits.length;
    console.log(`\n  ✗ ${name}`);
    for (const h of hits) console.log(`    L${h.n}  ${h.msg}\n         "${h.snip}"`);
  } else {
    console.log(`  ✓ ${name}`);
  }
}
// "clean, sounds human" was the green build that proved nothing: it said that with the voice
// signals at zero. It now says exactly what it checked, and names what it did not.
const tail = advisories ? `  ${advisories} voice-floor advisory(ies) — read them, they are not blockers.\n` : "";
console.log(
  flags
    ? `\n  ${flags} flag(s). Fix before shipping.\n${tail}`
    : `\n  clean on the mechanical tier: no dashes, no banned phrases, no residue.\n` +
      `  That is all a script can certify. Voice is judged by reading it.\n${tail}`,
);
process.exit(flags ? 1 : 0);
