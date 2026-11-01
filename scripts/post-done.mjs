#!/usr/bin/env node
// One command to record a LinkedIn post and move the queue on.
//
//   node scripts/post-done.mjs <linkedin-url> [--lesson <dir>] [--dry-run] [--force]
//   node scripts/post-done.mjs --self-test
//
// Defaults to the lesson currently "Up next" in data/linkedin-queue.md. Writes the
// linkedin channel (status, url, published date) into meta.yaml and url_linkedin into
// lesson.md, rebuilds the registry, then re-runs linkedin-next so the queue shows the
// next post. Idempotent. Refuses to replace a different recorded URL without --force.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readChannel, setChannel, setFrontKey } from "./lib/record.mjs";
import { urlProblem, selfTest } from "./lib/linkedin.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const fail = (m) => { console.error(`post-done: ${m}`); process.exit(1); };

if (flag("--self-test")) { selfTest(); process.exit(process.exitCode || 0); }

const li = args.indexOf("--lesson");
const lessonArg = li >= 0 ? args[li + 1] : "";
const url = args.find((a, i) => !a.startsWith("--") && i !== (li >= 0 ? li + 1 : -1)) || "";
const bad = urlProblem(url);
if (bad) fail(`${bad}. Usage: post-done <https://www.linkedin.com/...> [--lesson <dir>]`);

let lesson = lessonArg.replace(/^.*lessons\//, "").replace(/\/$/, "");
if (!lesson) {
  const q = join(ROOT, "data", "linkedin-queue.md");
  if (!existsSync(q)) fail("no data/linkedin-queue.md; run linkedin-next.mjs or pass --lesson <dir>");
  lesson = (/`lessons\/([^/`]+)\/meta\.yaml`/.exec(readFileSync(q, "utf8")) || [])[1] || "";
  if (!lesson) fail("could not find the Up next lesson in data/linkedin-queue.md; pass --lesson <dir>");
}
const mp = join(ROOT, "lessons", lesson, "meta.yaml"), lp = join(ROOT, "lessons", lesson, "lesson.md");
if (!existsSync(mp) || !existsSync(lp)) fail(`lessons/${lesson} has no meta.yaml and lesson.md`);

const meta = readFileSync(mp, "utf8"), md = readFileSync(lp, "utf8");
const cur = readChannel(meta, "linkedin");
if (cur.url && cur.url !== url && !flag("--force")) {
  fail(`lessons/${lesson} already records ${cur.url}. Pass --force to replace it.`);
}
const date = cur.url === url && cur.published ? cur.published : new Date().toISOString().slice(0, 10);
const newMeta = setChannel(meta, "linkedin", { status: "published", url, published: date });
const newMd = setFrontKey(md, "url_linkedin", url);

const dry = flag("--dry-run");
console.log(`${dry ? "[dry run] would record" : "recording"} LinkedIn post for ${lesson}`);
console.log(`  meta.yaml  channels.linkedin: status published, url ${url}, published ${date}`);
console.log(`  lesson.md  url_linkedin: ${url}`);
if (newMeta === meta && newMd === md) console.log("  already recorded, no file changes");
if (dry) { console.log("  nothing written, registry and queue untouched"); process.exit(0); }

if (newMeta !== meta) writeFileSync(mp, newMeta);
if (newMd !== md) writeFileSync(lp, newMd);
for (const s of ["build-registry.mjs", "linkedin-next.mjs"]) {
  process.stdout.write(execFileSync(process.execPath, [join(HERE, s)], { cwd: ROOT, encoding: "utf8" }));
}
