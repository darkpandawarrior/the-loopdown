#!/usr/bin/env node
// Single source of truth generator. Scans archive/*.md and lessons/*/lesson.md
// frontmatter, writes data/registry.json, and rebuilds the tables inside
// README.md between the <!-- REGISTRY:START --> / <!-- REGISTRY:END --> markers.
//
//   node scripts/build-registry.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim().replace(/^["']|["']$/g, "");
    if (v.startsWith("[") && v.endsWith("]")) {
      v = v.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
    }
    out[kv[1]] = v;
  }
  return out;
}

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

const registry = { generated: "run `node scripts/build-registry.mjs`", counts: { archive: archive.length, lessons: lessons.length }, archive, lessons };
writeFileSync(join(ROOT, "data", "registry.json"), JSON.stringify(registry, null, 2) + "\n");

// --- README tables ---
const tags = (t) => (Array.isArray(t) ? t : t ? [t] : []).slice(0, 4).map((x) => `\`${x}\``).join(" ");
const link = (title, file) => `[${title}](${file})`;

const lessonRows = lessons.length
  ? lessons.map((l) => `| ${l.created || "—"} | ${link(l.title, l.file)} | ${l.pillar || "—"} | ${l.status || "—"} | ${tags(l.tags)} |`).join("\n")
  : "| — | _no lessons yet — run `node scripts/new-lesson.mjs`_ | | | |";

const archiveRows = archive
  .map((a) => `| ${link(a.title, a.file)} | ${a.form || "—"} | ${a.era || "—"} | ${a.words || "—"} | ${tags(a.tags)} |`)
  .join("\n");

const block = `<!-- REGISTRY:START -->
### 📡 Lessons (dev content)

| Date | Title | Pillar | Status | Tags |
|------|-------|--------|--------|------|
${lessonRows}

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
