#!/usr/bin/env node
// Scaffold a new lesson folder from the template.
//
//   node scripts/new-lesson.mjs "dead reckoning gps" --pillar location --project Mileway
//
// Creates lessons/YYYY-MM-DD-<slug>/ with lesson.md, linkedin.md, article.md,
// meta.yaml, and assets/card.yaml prefilled. Date is passed in (scripts can't
// guess "today" reliably); defaults to an env DATE or a placeholder you edit.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const title = args.find((a) => !a.startsWith("--")) || "untitled";
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const date = opt("date", process.env.DATE || "YYYY-MM-DD");
const pillar = opt("pillar", "engineering");
const project = opt("project", "");
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const dir = join(ROOT, "lessons", `${date}-${slug}`);

if (existsSync(dir)) {
  console.error(`already exists: ${dir}`);
  process.exit(1);
}
mkdirSync(join(dir, "assets"), { recursive: true });

const write = (name, content) => writeFileSync(join(dir, name), content);

write("lesson.md", `---
title: "${title}"
slug: ${slug}
type: lesson
pillar: ${pillar}
project: ${project}
tags: []
status: draft            # draft | ready | scheduled | published
created: ${date}
channels: [linkedin, devto, hashnode, medium]
---

# ${title}

## The hook
<!-- One line that grabs a collar. See voice/voice-profile.md #1. -->

## The insight
<!-- The single non-obvious engineering lesson, written ONCE. Everything else adapts from here. -->

## The story / how it played out
<!-- Stage it. Real numbers, real context from ${project || "the project"}. -->

## The takeaway
<!-- What they remember. The payload under the play. -->

## Receipts
<!-- Links, commits, metrics that make it defensible in an interview. -->
`);

write("linkedin.md", `<!-- LinkedIn adapt. Target: hook + ≤1300 chars + CTA + 3-5 hashtags. Check vs voice-profile.md ship checklist. -->

`);

write("article.md", `---
title: "${title}"
canonical: the-loopdown/lessons/${date}-${slug}
tags: []
cover: assets/card.png
---

<!-- Long-form adapt for Medium / dev.to / Hashnode. Same soul, room to breathe. -->
`);

write("meta.yaml", `slug: ${slug}
status: draft
channels:
  linkedin:  { status: pending, url: "", scheduled: "", published: "", impressions: 0, reactions: 0, comments: 0 }
  devto:     { status: pending, url: "", published: "", reactions: 0, comments: 0 }
  hashnode:  { status: pending, url: "", published: "", reactions: 0, comments: 0 }
  medium:    { status: pending, url: "", published: "", claps: 0 }
`);

write("assets/card.yaml", `template: code-card
accent: "#7c5cff"
pillar: ${pillar}
handle: "@siddharthpandalai"
title:
  - "First line of title"
  - "second line"
code:
  - "// up to 7 lines"
  - "// of a code snippet"
  - "// or pseudo-code that"
  - "// stages the insight"
takeaway:
  - "The one-line lesson,"
  - "the part they screenshot."
`);

console.log(`scaffolded ${dir}`);
console.log(`next: edit lesson.md → adapt linkedin.md/article.md → fill assets/card.yaml → node scripts/render.mjs lessons/${date}-${slug}`);
