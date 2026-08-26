#!/usr/bin/env node
// Does the voice gate actually SEE every published piece?
//
//   node scripts/lint-coverage.mjs fiction/morkinstar-journals
//
// This exists because lint-voice.mjs selects files by FILENAME PREFIX, and a
// prefix allow-list silently stops covering a series the day that series picks
// a new prefix. That is not hypothetical: the sibling season shipped as
// `dd-01-` through `dd-10-`, the pattern was `^(?:s\d+-)?\d+-`, and the
// directory run linted 47 files, could not see the other ten, and printed
// "clean, sounds human" over a whole season it had never opened.
//
// A gate whose coverage is invisible is worse than no gate, because it is
// reported as a pass. So coverage is checked against something the filename
// convention cannot drift away from: `type: fiction` in the frontmatter, which
// is what every published piece carries and no working file does. bible.md,
// the doctrines and the council records are `reference` / `decision` / `index`
// and are correctly out of scope, for the reason lint-voice's own comment
// gives: leak-doctrine.md discusses the residue tag in plain prose and linting
// it would flag the guard's own documentation.
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const target = process.argv[2];
if (!target) {
  console.error("usage: node scripts/lint-coverage.mjs <fiction-dir>");
  process.exit(2);
}

/** Kept identical to lint-voice.mjs by the assertion at the bottom of this file. */
const LINTED = /^(?:s\d+-|dd-)?\d+-|^pilot-/;

const dir = resolve(target);
const md = readdirSync(dir).filter((f) => f.endsWith(".md"));

const published = md.filter((f) => /^type:\s*fiction\s*$/m.test(readFileSync(resolve(dir, f), "utf8")));
const missed = published.filter((f) => !LINTED.test(f));
// The other direction matters too: a pattern that matches a working file would
// lint the doctrine that documents the guard.
const overreach = md.filter((f) => LINTED.test(f) && !published.includes(f));

console.log(`[lint-coverage] ${md.length} .md, ${published.length} published (type: fiction), ${published.length - missed.length} covered`);

let fail = 0;
if (missed.length) {
  fail = 1;
  console.error(`\n[lint-coverage] ${missed.length} PUBLISHED piece(s) the voice gate cannot see:`);
  for (const f of missed) console.error(`  ${f}`);
  console.error(`\nAdd the prefix to lint-voice.mjs's filter AND to LINTED in this file, in the same change.`);
}
if (overreach.length) {
  fail = 1;
  console.error(`\n[lint-coverage] the filter reaches ${overreach.length} file(s) that are not published prose:`);
  for (const f of overreach) console.error(`  ${f}`);
}
if (!fail) console.log("[lint-coverage] every published piece is inside the gate.");
process.exit(fail);
