#!/usr/bin/env node
// One-time ingest: wrap the converted .tmp_*.txt bodies into archive/*.md with
// curated frontmatter. Safe to re-run — it overwrites archive/*.md from the tmp
// files if they are present, and is a no-op once the tmp files are cleaned up.
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const A = join(ROOT, "archive");

// Curated metadata for the existing corpus. era = when it was written / its world.
const PIECES = [
  { slug: "the-loopdown-story", title: "The Loopdown", era: "2020", form: "short-fiction",
    tags: ["time-loop", "sci-fi", "world-building", "diary"],
    blurb: "A week that refuses to end. 52 iterations of the same Wednesday — the namesake of this whole repo." },
  { slug: "deadline", title: "Deadline", era: "2018", form: "short-fiction",
    tags: ["memento-mori", "sci-fi", "diary", "philosophy"],
    blurb: "Death shows up in a skull t-shirt and hands you six months. A memento-mori meditation wearing a Deadpool costume." },
  { slug: "ctc-cost-to-company", title: "CTC: Cost To Company", era: "2069 (written 2020)", form: "short-fiction",
    tags: ["dystopia", "satire", "world-building", "corporate"],
    blurb: "A 2069 climate dystopia where salary is paid in days of drinkable water. Placement culture as speculative fiction." },
  { slug: "pointer-games", title: "Pointer Games", era: "campus-lore", form: "short-fiction",
    tags: ["campus-lore", "mystery", "hinglish", "world-building"],
    blurb: "A midnight call from a legendary dropout, a conspiracy in the exam schedule, and the boogeyman of MANIT." },
  { slug: "prophecy-201112003", title: "Prophecy #201112003", era: "campus-lore", form: "short-fiction",
    tags: ["campus-lore", "mystery", "world-building"],
    blurb: "A scholar number, a prophecy, and campus mythology." },
  { slug: "chronicles-of-an-nre-kid", title: "Chronicles Of An NRE Kid", era: "personal-essay", form: "essay",
    tags: ["memoir", "identity", "growing-up"],
    blurb: "Growing up between two worlds as a Non-Resident kid." },
  { slug: "its-a-doggone-life", title: "It's A Doggone Life", era: "personal-essay", form: "essay",
    tags: ["memoir", "dogs", "heart"],
    blurb: "A dog's-eye life, and everything it teaches." },
  { slug: "honest-college-fests", title: "Honest College Fests", era: "humor", form: "humor",
    tags: ["satire", "college", "listicle"],
    blurb: "College fests, described honestly. The gap between the poster and the reality." },
  { slug: "the-pun-force", title: "The Pun Force", era: "humor", form: "humor",
    tags: ["puns", "meta", "comedy", "world-building"],
    blurb: "An origin myth for the pun, narrated by the punniest man alive. The building block of humor, weaponized." },
  { slug: "college-clubs", title: "College Clubs: Why Aren't You In Any?", era: "opinion", form: "opinion",
    tags: ["opinion", "college", "soft-skills"],
    blurb: "The case for joining a society when time, sleep, and parties are all in deficit." },
];

let ingested = 0;
for (const p of PIECES) {
  const tmp = join(A, `.tmp_${p.slug}.txt`);
  if (!existsSync(tmp)) continue;
  let body = readFileSync(tmp, "utf8").trim();
  // Drop a duplicate leading title line if the doc repeats it.
  const firstLine = body.split("\n")[0].trim();
  if (firstLine.toLowerCase() === p.title.toLowerCase()) {
    body = body.split("\n").slice(1).join("\n").trim();
  }
  const words = body.split(/\s+/).filter(Boolean).length;
  const fm = [
    "---",
    `title: ${JSON.stringify(p.title)}`,
    `slug: ${p.slug}`,
    `type: archive`,
    `form: ${p.form}`,
    `era: ${JSON.stringify(p.era)}`,
    `status: archived`,
    `tags: [${p.tags.join(", ")}]`,
    `words: ${words}`,
    `blurb: ${JSON.stringify(p.blurb)}`,
    `source: private/originals`,
    "---",
    "",
    `# ${p.title}`,
    "",
    `> ${p.blurb}`,
    "",
    body,
    "",
  ].join("\n");
  writeFileSync(join(A, `${p.slug}.md`), fm);
  rmSync(tmp);
  ingested++;
}
console.log(`Ingested ${ingested} archive piece(s).`);
