#!/usr/bin/env node
// Stage every ready lesson on dev.to as a DRAFT, so the daily job only has to
// flip one live.
//
//   node scripts/stage-drafts.mjs            # stage everything not yet staged
//   node scripts/stage-drafts.mjs --dry-run  # say what it would do, touch nothing
//   node scripts/stage-drafts.mjs --limit 3  # stage at most three
//
// WHY THIS SHAPE. Publishing used to be one big act at 04:00: render, lint,
// audit, create the article and publish it, all in the same unattended run. So
// every failure in that chain was a failure to publish — and for five straight
// days the chain died on a PATH problem, with sixteen finished lessons waiting
// behind it.
//
// Staging splits the work where the risk changes. Creating a draft is private,
// reversible and idempotent: export.mjs records the article id in state.json
// and reuses it, so `--draft` then `--publish` update the SAME post rather than
// making two. Once a lesson is staged, the daily job's remaining job is a state
// flip on an article that already exists and has already passed its gates.
//
// It also puts the drafts somewhere a human can actually read them — dev.to's
// own editor — instead of only on this disk.
//
// A draft is NOT publication. publish-next.mjs's `alreadyOut` checks for
// `status: published`, never merely for an id, so staging does not empty the
// queue.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DRY = process.argv.includes("--dry-run");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

/** The node running this script — never the bare string, which launchd cannot
 *  resolve. Same reason publish-next.mjs uses it. */
const NODE = process.execPath;

const stamp = () => new Date().toISOString().replace("T", " ").slice(0, 19);
const log = (m) => console.log(`${stamp()}  ${m}`);

const lessonsDir = join(ROOT, "lessons");
const lessons = readdirSync(lessonsDir).filter((d) => /^\d{4}-\d{2}-\d{2}-/.test(d)).sort();

const metaOf = (d) => {
  const p = join(lessonsDir, d, "meta.yaml");
  return existsSync(p) ? readFileSync(p, "utf8") : "";
};
const stateOf = (d) => {
  const p = join(lessonsDir, d, "state.json");
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; }
};

const isReady = (d) => /^status:\s*ready\s*$/m.test(metaOf(d));
const isPublished = (d) => stateOf(d)?.devto?.status === "published";
const isStaged = (d) => !!stateOf(d)?.devto?.id && !isPublished(d);

const todo = lessons.filter((d) => isReady(d) && !isPublished(d) && !isStaged(d));
const staged = lessons.filter(isStaged);

log(`${lessons.length} lessons · ${staged.length} already staged · ${todo.length} to stage`);
if (!todo.length) { log("nothing to do."); process.exit(0); }

let ok = 0;
const failed = [];

for (const d of todo.slice(0, LIMIT)) {
  // Lint before staging, not only before publishing: a draft that cannot pass
  // the voice gate is not "ready to flip", and finding that out now beats
  // finding it out in an unattended run at 04:00.
  try {
    execFileSync(NODE, [join(HERE, "lint-voice.mjs"), join("lessons", d)], { cwd: ROOT, encoding: "utf8" });
  } catch (e) {
    failed.push(d);
    log(`  SKIPPED ${d} — voice lint: ${String(e.stdout || e.message).trim().split("\n")[0]}`);
    continue;
  }

  if (DRY) { log(`  dry run: would stage ${d} as a dev.to draft`); ok++; continue; }

  try {
    const out = execFileSync(NODE, [join(HERE, "export.mjs"), join("lessons", d), "--draft"],
      { cwd: ROOT, encoding: "utf8" });
    const url = /https:\/\/dev\.to\/\S+/.exec(out)?.[0] ?? "(no url returned)";
    log(`  staged ${d} -> ${url}`);
    ok++;
  } catch (e) {
    failed.push(d);
    log(`  FAILED ${d}: ${String(e.stdout || e.message).trim().split("\n").slice(0, 3).join(" | ")}`);
  }
}

log(`${DRY ? "dry run: " : ""}${ok} staged, ${failed.length} failed.`);
if (failed.length) {
  log(`needs a human: ${failed.join(", ")}`);
  process.exit(1);
}
