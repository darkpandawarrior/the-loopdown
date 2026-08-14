#!/usr/bin/env node
// Single source of truth generator. Scans archive/*.md and lessons/*/lesson.md
// frontmatter, writes data/registry.json, and rebuilds the tables inside
// README.md between the <!-- REGISTRY:START --> / <!-- REGISTRY:END --> markers.
//
//   node scripts/build-registry.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, mkdirSync } from "node:fs";
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
      const fm = frontmatter(readFileSync(lp, "utf8"));
      // collect per-platform post URLs (url_devto / url_linkedin / url_medium / url_hashnode)
      const links = {};
      for (const p of ["devto", "linkedin", "medium", "hashnode"]) {
        if (fm[`url_${p}`]) links[p] = fm[`url_${p}`];
      }
      return { file: `lessons/${d}/lesson.md`, dir: d, ...fm, links };
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

// --- series hubs: one bingeable index page per series (cross-platform "read the series" target) ---
const bySeries = {};
for (const l of lessons) if (l.series) (bySeries[l.series] ||= []).push(l);
const seriesDir = join(ROOT, "series");
if (Object.keys(bySeries).length) mkdirSync(seriesDir, { recursive: true });
const titleize = (id) => String(id).split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
for (const [id, eps] of Object.entries(bySeries)) {
  eps.sort((a, b) => String(a.created).localeCompare(String(b.created)));
  const rows = eps.map((e, i) => `${i + 1}. **[${e.title}](../${e.file})** — ${e.created} ${e.status === "published" ? "" : `_(${e.status})_`}`).join("\n");
  writeFileSync(join(seriesDir, `${id}.md`),
    `# ${titleize(id)}\n\n_Part of [The Loopdown](../README.md). ${eps.length} episode(s)._\n\n${rows}\n`);
}
const series = Object.entries(bySeries).map(([id, eps]) => ({ id, title: titleize(id), episodes: eps.length })).sort((a, b) => a.id.localeCompare(b.id));

// --- anthology (The Morkinstar Journals) ---
// Metadata and the starmap only. Story bodies and plates stay as files in the repo
// and are fetched by consumers at build time, because a registry that carries 40k
// words and a megabyte of base64 stops being an index and becomes a payload.
const ficDir = join(ROOT, "fiction/morkinstar-journals");
let anthology = null;
if (existsSync(ficDir)) {
  const read = (f) => frontmatter(readFileSync(join(ficDir, f), "utf8"));
  const s1Files = ["../../archive/legend-of-koaeluae-scales.md",
    ...readdirSync(ficDir).filter((f) => /^\d\d-.*\.md$/.test(f)).sort()];
  const s2Files = readdirSync(ficDir).filter((f) => /^s2-\d\d-.*\.md$/.test(f)).sort();
  const webDir = join(ficDir, "assets/web");
  const plates = existsSync(webDir) ? readdirSync(webDir) : [];
  const plateFor = (season, idx) =>
    plates.find((p) => p.startsWith(`s${season}-${String(idx).padStart(2, "0")}-`)) || "";

  const entryOf = (season) => (f, i) => {
    const fm = f.startsWith("../")
      ? frontmatter(readFileSync(join(ficDir, f), "utf8"))
      : read(f);
    const idx = i + 1;
    return {
      season, idx,
      title: fm.title, slug: fm.slug,
      file: f.startsWith("../") ? "archive/legend-of-koaeluae-scales.md" : `fiction/morkinstar-journals/${f}`,
      plate: plateFor(season, idx) ? `fiction/morkinstar-journals/assets/web/${plateFor(season, idx)}` : "",
      entry: fm.entry ?? null, page: fm.page ?? null,
      planet: fm.planet ?? "", system: fm.system ?? "",
      phenomenon: fm.phenomenon ?? "", blurb: fm.blurb ?? "",
      words: fm.words ?? "", tags: fm.tags ?? [],
    };
  };

  const starmapPath = join(ficDir, "starmap.json");
  anthology = {
    slug: "the-morkinstar-journals",
    title: "The Morkinstar Journals",
    tagline: "Fourteen gods. Fourteen monsters. Thirteen names.",
    seasons: [
      { n: 1, title: "The Directory", blurb: "He files. Ten entries, each a world's legend and the phenomenon it explains." },
      { n: 2, title: "The Ninety-One Pages", blurb: "He stops filing. Each page must contain something nobody has ever written down." },
    ],
    entries: [...s1Files.map(entryOf(1)), ...s2Files.map(entryOf(2))],
    starmap: existsSync(starmapPath) ? JSON.parse(readFileSync(starmapPath, "utf8")) : null,
  };
}

const registry = {
  generated: "run `node scripts/build-registry.mjs`",
  counts: {
    archive: archive.length, lessons: lessons.length, cast: castIndex.length, series: series.length,
    anthology: anthology ? anthology.entries.length : 0,
  },
  archive, lessons, cast: castIndex, series, anthology,
};
writeFileSync(join(ROOT, "data", "registry.json"), JSON.stringify(registry, null, 2) + "\n");

// --- README tables ---
const tags = (t) => (Array.isArray(t) ? t : t ? [t] : []).slice(0, 4).map((x) => `\`${x}\``).join(" ");
const link = (title, file) => `[${title}](${file})`;

const statusIcon = (s) => (s === "published" ? "🟢 live" : s === "ready" ? "🟡 ready" : s === "scheduled" ? "🔵 scheduled" : "⚪ draft");
const lessonRows = lessons.length
  ? lessons.map((l) => `| ${l.created || "—"} | ${link(l.title, l.file)} | ${l.series || "—"} | ${statusIcon(l.status)} | ${l.live ? `[read →](${l.live})` : "—"} |`).join("\n")
  : "| — | _no lessons yet — run `node scripts/new-lesson.mjs`_ | | | |";

const archiveRows = archive
  .map((a) => `| ${link(a.title, a.file)} | ${a.form || "—"} | ${a.era || "—"} | ${a.words || "—"} | ${tags(a.tags)} |`)
  .join("\n");

const castRows = castIndex.length
  ? castIndex.map((c) => `| \`${c.id}\` | ${c.appearances} | ${c.in.map((x) => link(x.title, x.file)).join(", ")} |`).join("\n")
  : "| _no cast on stage yet_ | 0 | |";

const block = `<!-- REGISTRY:START -->
### 📡 Lessons (dev content)

| Date | Title | Series | Status | Live |
|------|-------|--------|--------|------|
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

// The bestiary is a record, not a claim, so it rebuilds whenever the registry
// does rather than whenever someone remembers. It shells out instead of
// importing because it launches Chromium and should not block a plain registry
// build if that fails on a headless box.
try {
  const { execFileSync } = await import("node:child_process");
  execFileSync("node", [new URL("bestiary.mjs", import.meta.url).pathname], { stdio: "inherit" });
} catch (e) {
  console.log("  bestiary skipped:", e.message.split("\n")[0]);
}
