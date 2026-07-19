#!/usr/bin/env node
// One command to push a lesson everywhere. Publishes dev.to (via export.mjs), then
// writes ONE file, out/DISTRIBUTE.md, with every remaining manual step pre-filled:
// the LinkedIn text, the carousel path, and the Medium/Hashnode import URLs.
//
//   node scripts/distribute.mjs lessons/<dir> --publish   (or --draft)
//
// After it runs, open out/DISTRIBUTE.md and work top to bottom. That's the whole post.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const lessonDir = argv.find((a) => !a.startsWith("--"));
if (!lessonDir) { console.error("usage: node scripts/distribute.mjs lessons/<dir> [--draft|--publish]"); process.exit(1); }
const modeFlag = argv.includes("--publish") ? "--publish" : argv.includes("--draft") ? "--draft" : ""; // default: dry-run (safe)

// 1. run the export (publishes dev.to, writes out/ paste files)
console.log(`\n→ exporting (${modeFlag || "dry-run"}) ...\n`);
execFileSync("node", [join(HERE, "export.mjs"), lessonDir, ...(modeFlag ? [modeFlag] : [])], { stdio: "inherit" });

// 2. gather results
const read = (f) => (existsSync(resolve(lessonDir, f)) ? readFileSync(resolve(lessonDir, f), "utf8") : "");
const state = existsSync(resolve(lessonDir, "state.json")) ? JSON.parse(read("state.json")) : {};
const devtoUrl = state.devto?.url || "(run --publish to get the dev.to URL)";
const linkedin = read("out/linkedin.txt").trim();
const hasCarousel = existsSync(resolve(lessonDir, "assets/carousel.pdf"));
const fmTitle = (read("lesson.md").match(/title:\s*"?([^"\n]+)"?/) || [])[1] || "this post";

// 3. write the single distribution checklist
const md = `# Distribute: ${fmTitle}

dev.to is done automatically. Do the rest top to bottom.

## 1. dev.to  ✅ (auto)
${devtoUrl}

## 2. LinkedIn  (paste + upload)
- [ ] Paste the text below into a new LinkedIn post
${hasCarousel ? "- [ ] Attach a **document** and upload `assets/carousel.pdf`" : ""}
- [ ] Post, then reply to every comment in the first 2 hours

\`\`\`
${linkedin}
\`\`\`

## 3. Medium  (import, keeps canonical clean)
- [ ] Go to https://medium.com/p/import
- [ ] Paste: ${devtoUrl}
- [ ] Publish

## 4. Hashnode  (import)
- [ ] New article → Import from URL
- [ ] Paste: ${devtoUrl}
- [ ] Publish

## 5. Record it
- [ ] Put the 4 URLs into \`meta.yaml\`, set status: published
- [ ] \`node scripts/build-registry.mjs\` to update the wall
`;
writeFileSync(resolve(lessonDir, "out/DISTRIBUTE.md"), md);
console.log(`\n✓ everything is in one place → ${lessonDir}/out/DISTRIBUTE.md\n  open it and work top to bottom.\n`);
