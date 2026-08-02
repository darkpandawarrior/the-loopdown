#!/usr/bin/env node
// Publish the next queued lesson to dev.to. Built for unattended use.
//
//   node scripts/publish-next.mjs            # publish one, if one qualifies
//   node scripts/publish-next.mjs --dry-run  # say what it would do, touch nothing
//
// Queue order is lesson date. A lesson qualifies only if:
//   1. meta.yaml says status: ready (not draft, not already published)
//   2. it has no recorded dev.to url and no state.json article id
//   3. scripts/lint-voice.mjs passes on it with zero flags
//   4. the harness claim audit passes, when it is present
//
// Any failed gate stops the run and publishes NOTHING. This is deliberate: an
// unattended job pointed at a public platform should refuse rather than guess,
// and a failing gate usually means the next post needs a human, not a retry.
import { readFileSync, existsSync, appendFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DRY = process.argv.includes("--dry-run");
const LOG = join(ROOT, "data", "publish.log");

const stamp = () => new Date().toISOString().replace("T", " ").slice(0, 19);
const log = (m) => {
  const line = `${stamp()}  ${m}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
};

// --- cadence guard --------------------------------------------------------
// launchd cannot express "every 2 days" without drifting, so the job runs daily
// and the gap is enforced here against the log. Self-healing: if the machine was
// asleep for three days, the next run publishes instead of silently skipping.
const GAP_HOURS = Number((process.argv.find((a) => a.startsWith("--min-gap-hours=")) || "").split("=")[1] || 40);
if (existsSync(LOG) && !process.argv.includes("--force")) {
  const last = readFileSync(LOG, "utf8").trim().split("\n").filter((l) => /PUBLISHED/.test(l)).pop();
  if (last) {
    const when = Date.parse(last.slice(0, 19).replace(" ", "T"));
    const hrs = (Date.now() - when) / 3.6e6;
    if (hrs < GAP_HOURS) {
      log(`last publish was ${hrs.toFixed(1)}h ago, minimum gap is ${GAP_HOURS}h. Nothing to do.`);
      process.exit(0);
    }
  }
}

// --- find the queue -------------------------------------------------------
const lessonsDir = join(ROOT, "lessons");
const lessons = readdirSync(lessonsDir)
  .filter((d) => /^\d{4}-\d{2}-\d{2}-/.test(d))
  .sort(); // date-ordered, which is the publish order

const readMeta = (d) => {
  const p = join(lessonsDir, d, "meta.yaml");
  return existsSync(p) ? readFileSync(p, "utf8") : "";
};
const alreadyOut = (d) => {
  const meta = readMeta(d);
  if (/url:\s*https:\/\/dev\.to/.test(meta)) return true;
  const s = join(lessonsDir, d, "state.json");
  if (existsSync(s)) { try { return !!JSON.parse(readFileSync(s, "utf8")).devto?.id; } catch { return false; } }
  return false;
};
const isReady = (d) => /^status:\s*ready\s*$/m.test(readMeta(d));

const queue = lessons.filter((d) => isReady(d) && !alreadyOut(d));
if (!queue.length) { log("queue empty: nothing marked ready and unpublished. Stopping."); process.exit(0); }

const next = queue[0];
log(`next in queue: ${next}   (${queue.length} waiting)`);

// --- gates ----------------------------------------------------------------
const gate = (name, fn) => {
  try { fn(); log(`  gate ok: ${name}`); }
  catch (e) {
    log(`  GATE FAILED: ${name}`);
    log(`  ${String(e.stdout || e.message).trim().split("\n").slice(0, 12).join("\n  ")}`);
    log(`  publishing nothing. ${next} needs a human.`);
    process.exit(1);
  }
};

gate("voice lint", () =>
  execFileSync("node", [join(HERE, "lint-voice.mjs"), join("lessons", next)], { cwd: ROOT, encoding: "utf8" }));

const audit = "/Users/darkpandawarrior/Tools/DevTools/AgentHarness/skills/claim-audit/audit.mjs";
if (existsSync(audit)) gate("claim audit", () => execFileSync("node", [audit], { encoding: "utf8" }));
else log("  gate skipped: claim audit not found on this machine");

// --- publish --------------------------------------------------------------
if (DRY) { log(`dry run: would publish ${next} to dev.to. Nothing sent.`); process.exit(0); }

try {
  const out = execFileSync("node", [join(HERE, "export.mjs"), join("lessons", next), "--publish"],
    { cwd: ROOT, encoding: "utf8" });
  const url = (out.match(/https:\/\/dev\.to\/\S+/) || [])[0] || "(no url in output)";
  log(`PUBLISHED ${next} -> ${url}`);
  const warned = /WARNING/.test(out);
  if (warned) log(`  note: export warned. ${out.split("\n").filter((l) => /WARNING/.test(l)).join(" | ")}`);
  log(`  ${queue.length - 1} left in the queue`);
} catch (e) {
  log(`PUBLISH FAILED for ${next}: ${String(e.stdout || e.message).trim().split("\n").slice(-6).join(" | ")}`);
  process.exit(1);
}
