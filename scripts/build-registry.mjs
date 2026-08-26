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
  // Season one predates the sN- prefix, so its entries are bare `NN-` and its
  // first entry lives in the archive. Every season after it is `sN-NN-`, so
  // discovery is derived from the season number rather than written out again:
  // a fifth season is one row in `seasons` below and nothing here.
  const ficFiles = readdirSync(ficDir);
  const filesFor = (n) => [
    ...(n === 1 ? ["../../archive/legend-of-koaeluae-scales.md"] : []),
    ...ficFiles.filter((f) => (n === 1 ? /^\d\d-.*\.md$/ : new RegExp(`^s${n}-\\d\\d-.*\\.md$`)).test(f)).sort(),
  ];
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
      // Season 3 only: which of the fourteen burnings this is. The reading page
      // uses it to deepen the scorch across the season from data rather than a
      // hardcoded slug, so it has to survive the registry hop.
      kindling: fm.kindling ?? null,
      // Season 4 is one city, so its place field is `district`, not `planet`.
      // Carried alongside rather than folded into planet: a consumer that says
      // "planet" under a card would be lying about a stairwell.
      planet: fm.planet ?? "", system: fm.system ?? "", district: fm.district ?? "",
      phenomenon: fm.phenomenon ?? "", blurb: fm.blurb ?? "",
      words: fm.words ?? "", tags: fm.tags ?? [],
    };
  };

  const starmapPath = join(ficDir, "starmap.json");
  // The tellers. Sigils are geometry hashed from a name, which is right for a
  // thing with no face. These are the people, and they are the whole thesis, so
  // they are drawn rather than generated.
  const witPath = join(ficDir, "witnesses.json");
  const witDir = join(ficDir, "assets/witnesses");
  const drawn = existsSync(witDir) ? readdirSync(witDir).filter((f) => f.endsWith(".png")) : [];
  // A teller without a portrait still ships, with art: "".
  //
  // This used to FILTER on the drawn file existing, which quietly discarded any
  // teller who had been harvested but not yet drawn. Season Four's fourteen
  // landed and the roster went from 20 to 34 while the registry stayed at 20,
  // because none of them had a portrait: the canon fix was correct and
  // invisible, and nothing said so.
  //
  // The site has handled this state since the tellers tab was rebuilt. It draws
  // a deliberate undrawn card rather than a broken image, on the same footing
  // as the argued absences, because law five is about who told it and a missing
  // drawing is not a missing teller. Dropping the record was the generator
  // deciding a person does not exist until an illustrator gets to them.
  const witnesses = existsSync(witPath)
    ? JSON.parse(readFileSync(witPath, "utf8")).witnesses.map((w) => ({
        ...w,
        art: drawn.includes(`${w.id}.png`) ? `fiction/morkinstar-journals/assets/witnesses/${w.id}.png` : "",
      }))
    : [];

  // The seasons array is the discovery list: `filesFor` reads the number off it.
  const seasons = [
    { n: 1, title: "The Directory", blurb: "Ten entries off the Directory beat. One world each: its legend, and the phenomenon the legend was built to explain." },
    { n: 2, title: "The Ninety-One Pages", blurb: "Ten pages out of a case of ninety-one. Nothing filed, nothing signed, and every page has to hold something nobody has ever written down." },
    { n: 3, title: "The Kindling", blurb: "Fourteen nights at one fire, the case emptying a page at a time, under a rule borrowed from Cendre: exactly one page survives." },
    { n: 4, title: "The Standing Charge", blurb: "Fourteen notices, posted on a public wall in a city built to the dimensions of his own filing. Each one carries the schedule it will be painted over on, in its first line." },
  ];

  // Unfiled work: fiction set in this universe that has not been given a season,
  // a series, or a designation. Discovered by the `pilot-` prefix rather than by
  // frontmatter, for the same reason the seasons are discovered by filename:
  // a rule you can see in `ls` does not drift from the rule in the generator.
  //
  // It is a SEPARATE array on purpose, not a season zero and not an extra row in
  // `entries`. Four seasons and forty-eight entries are load-bearing numbers,
  // asserted by guards on both sides of the registry hop and printed on four
  // pages, and an unfiled piece is not one of the forty-eight. It is what the
  // corpus calls it: a designation that has not been assigned.
  const unfiled = ficFiles
    .filter((f) => /^pilot-.*\.md$/.test(f))
    .sort()
    .map((f, i) => {
      const fm = read(f);
      return {
        idx: i + 1,
        slug: fm.slug,
        title: fm.title,
        file: `fiction/morkinstar-journals/${f}`,
        // The frontmatter's own answer, printed rather than resolved. The corpus
        // uses square brackets for a value a form requires and nobody has filled
        // in, so "[unassigned]" is the designation, not a missing one.
        series: fm.series ?? "[unassigned]",
        blurb: fm.blurb ?? "",
        words: fm.words ?? "",
        tags: fm.tags ?? [],
      };
    });

  // THE DARK DIRECTORY. A sibling series, not a fifth season, and the shape of
  // this block is the argument. Four seasons and forty-eight entries are
  // load-bearing numbers, printed on four pages and asserted on both sides of
  // the registry hop, and the sibling is not one of them: it shares a universe
  // and not a cast, and a reader who has read neither must lose nothing.
  //
  // So it gets `siblings`, an array, because there will be more than one of
  // these before there is a fifth season. Discovery is by filename prefix, the
  // same rule the seasons use, for the same reason: a rule you can see in `ls`
  // does not drift from the rule in the generator. lint-coverage.mjs already
  // learned that lesson the expensive way.
  const SIBLINGS = [
    {
      slug: "the-dark-directory",
      title: "The Dark Directory",
      tagline: "Ten retrieval files. Nine requesters. One index that has never once been wrong.",
      // The parent's four media are four relations between a record and its
      // reader: broadcast, never sent, destroyed, executed. This is the fifth
      // and the only one where somebody asked.
      medium: "retrieval",
      prefix: "dd",
    },
  ];

  const siblings = SIBLINGS.map((s) => {
    const files = ficFiles.filter((f) => new RegExp(`^${s.prefix}-\\d\\d-.*\\.md$`).test(f)).sort();
    return {
      ...s,
      prefix: undefined,
      entries: files.map((f, i) => {
        const fm = read(f);
        const idx = i + 1;
        const key = `${s.prefix}-${String(idx).padStart(2, "0")}`;
        const plate = plates.find((pl) => pl.startsWith(`${key}-`)) || "";
        return {
          idx,
          slug: fm.slug,
          title: fm.title,
          file: `fiction/morkinstar-journals/${f}`,
          plate: plate ? `fiction/morkinstar-journals/assets/web/${plate}` : "",
          blurb: fm.blurb ?? "",
          words: fm.words ?? "",
          tags: fm.tags ?? [],
        };
      }),
    };
  });

  anthology = {
    slug: "the-morkinstar-journals",
    title: "The Morkinstar Journals",
    tagline: "Fourteen gods. Fourteen monsters. Thirteen names.",
    seasons,
    entries: seasons.flatMap((s) => filesFor(s.n).map(entryOf(s.n))),
    unfiled,
    siblings,
    starmap: existsSync(starmapPath) ? JSON.parse(readFileSync(starmapPath, "utf8")) : null,
    witnesses,
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
