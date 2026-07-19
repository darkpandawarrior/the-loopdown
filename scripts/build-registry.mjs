#!/usr/bin/env node
// Single source of truth generator. Scans archive/*.md and lessons/*/lesson.md
// frontmatter, writes data/registry.json, and rebuilds the tables inside
// README.md between the <!-- REGISTRY:START --> / <!-- REGISTRY:END --> markers.
//
//   node scripts/build-registry.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseFrontmatter } from "./lib/frontmatter.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const frontmatter = (text) => parseFrontmatter(text).fm;

// --- archive ---
const archiveDir = join(ROOT, "archive");
const archive = readdirSync(archiveDir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => ({ file: `archive/${f}`, ...frontmatter(readFileSync(join(archiveDir, f), "utf8")) }))
  .sort((a, b) => String(a.title).localeCompare(String(b.title)));

// --- lessons ---
const lessonsDir = join(ROOT, "lessons");
let lessons = [];
if (existsSync(lessonsDir)) {
  lessons = readdirSync(lessonsDir)
    .filter((d) => statSync(join(lessonsDir, d)).isDirectory())
    .map((d) => {
      const lp = join(lessonsDir, d, "lesson.md");
      if (!existsSync(lp)) return null;
      return { file: `lessons/${d}/lesson.md`, dir: d, ...frontmatter(readFileSync(lp, "utf8")) };
    })
    .filter(Boolean)
    .sort((a, b) => String(b.created).localeCompare(String(a.created)));
}

// --- cast continuity: which characters appear in which lessons ---
const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const cast = {};
for (const l of lessons) {
  for (const c of asArray(l.cast)) {
    (cast[c] ||= []).push({ title: l.title, file: l.file, date: l.created });
  }
}
const castIndex = Object.entries(cast)
  .map(([id, apps]) => ({ id, appearances: apps.length, in: apps }))
  .sort((a, b) => b.appearances - a.appearances);

const registry = {
  generated: "run `node scripts/build-registry.mjs`",
  counts: { archive: archive.length, lessons: lessons.length, cast: castIndex.length },
  archive, lessons, cast: castIndex,
};
writeFileSync(join(ROOT, "data", "registry.json"), JSON.stringify(registry, null, 2) + "\n");

// --- README tables ---
const tags = (t) => (Array.isArray(t) ? t : t ? [t] : []).slice(0, 4).map((x) => `\`${x}\``).join(" ");
const link = (title, file) => `[${title}](${file})`;

const lessonRows = lessons.length
  ? lessons.map((l) => `| ${l.created || "—"} | ${link(l.title, l.file)} | ${l.pillar || "—"} | ${l.series || "—"} | ${l.status || "—"} |`).join("\n")
  : "| — | _no lessons yet — run `node scripts/new-lesson.mjs`_ | | | |";

const archiveRows = archive
  .map((a) => `| ${link(a.title, a.file)} | ${a.form || "—"} | ${a.era || "—"} | ${a.words || "—"} | ${tags(a.tags)} |`)
  .join("\n");

const castRows = castIndex.length
  ? castIndex.map((c) => `| \`${c.id}\` | ${c.appearances} | ${c.in.map((x) => link(x.title, x.file)).join(", ")} |`).join("\n")
  : "| _no cast on stage yet_ | 0 | |";

const block = `<!-- REGISTRY:START -->
### 📡 Lessons (dev content)

| Date | Title | Pillar | Series | Status |
|------|-------|--------|--------|--------|
${lessonRows}

### 🎭 Cast appearances (continuity)

| Character | Appearances | In |
|-----------|-------------|----|
${castRows}

### 📚 Archive (${archive.length} pieces)

| Title | Form | Era | Words | Tags |
|-------|------|-----|-------|------|
${archiveRows}
<!-- REGISTRY:END -->`;

const readmePath = join(ROOT, "README.md");
let readme = readFileSync(readmePath, "utf8");
readme = readme.replace(/<!-- REGISTRY:START -->[\s\S]*?<!-- REGISTRY:END -->/, block);
writeFileSync(readmePath, readme);

console.log(`registry: ${archive.length} archive, ${lessons.length} lessons → data/registry.json + README updated`);
