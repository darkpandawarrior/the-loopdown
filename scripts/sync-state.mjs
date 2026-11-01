#!/usr/bin/env node
// Copy each lesson's dev.to result from state.json into meta.yaml and lesson.md.
//
//   node scripts/sync-state.mjs [--dry-run] [--state-root <repo dir>]
//
// state.json is gitignored and is written by export.mjs, so it is the first place a
// publish lands. meta.yaml and lesson.md are what the registry and the site read, and
// they drifted: five lessons were live on dev.to while both still said "ready, pending".
// This makes the records agree with state.json. Idempotent: a second run changes nothing.
//
// Published date: state.devto.published if present, else the PUBLISHED line in
// data/publish.log, else the date already recorded, else left empty (never invented).
// Stale `# --- export draft` comment blocks are dropped only when they cite a temp-slug
// URL that differs from the published one.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { readChannel, setChannel, setFrontKey } from "./lib/record.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

export function dropStaleStamps(meta, publishedUrl) {
  return meta.replace(/\n?# --- export \w[\w-]* \(canonical: (\S+)\) ---\n(?:#   .*\n?)*/g, (blk, canon) =>
    /-temp-slug-/.test(canon) && canon !== publishedUrl ? "" : blk);
}

/** Pure: compute the new meta.yaml / lesson.md text for one lesson. */
export function syncOne({ meta, md, devto, logDate }) {
  if (!devto || devto.status !== "published" || !/^https:\/\/dev\.to\//.test(devto.url || "")) return { meta, md };
  const cur = readChannel(meta, "devto");
  const date = devto.published || logDate || cur.published || "";
  let m = setChannel(meta, "devto", { status: "published", url: devto.url, published: date });
  m = m.replace(/^status:\s*ready\s*$/m, "status: published");
  m = dropStaleStamps(m, devto.url);
  let d = setFrontKey(md, "url_devto", devto.url);
  if (/^status:\s*ready\s*$/m.test(d)) {
    d = setFrontKey(d, "status", "published");
    d = setFrontKey(d, "live", devto.url);
    if (date) d = setFrontKey(d, "published", date);
  }
  return { meta: m, md: d };
}

/** Sync every lesson. Returns the list of lessons changed. */
export function syncAll({ root = ROOT, stateRoot = root, dry = false } = {}) {
  const lessonsDir = join(root, "lessons");
  const logPath = join(stateRoot, "data", "publish.log");
  const log = existsSync(logPath) ? readFileSync(logPath, "utf8") : "";
  const changed = [];
  for (const d of readdirSync(lessonsDir).filter((x) => /^\d{4}-\d{2}-\d{2}-/.test(x)).sort()) {
    const sp = join(stateRoot, "lessons", d, "state.json");
    const mp = join(lessonsDir, d, "meta.yaml"), lp = join(lessonsDir, d, "lesson.md");
    if (!existsSync(sp) || !existsSync(mp) || !existsSync(lp)) continue;
    let devto;
    try { devto = JSON.parse(readFileSync(sp, "utf8")).devto; } catch { continue; }
    const logDate = (new RegExp(`^(\\d{4}-\\d{2}-\\d{2}) [\\d:]+\\s+PUBLISHED ${d} `, "m").exec(log) || [])[1];
    const meta = readFileSync(mp, "utf8"), md = readFileSync(lp, "utf8");
    const out = syncOne({ meta, md, devto, logDate });
    if (out.meta === meta && out.md === md) continue;
    changed.push(d);
    if (!dry) { writeFileSync(mp, out.meta); writeFileSync(lp, out.md); }
  }
  return changed;
}

function selfTest() {
  let bad = 0;
  const eq = (a, b, m) => { if (a !== b) { console.error(`FAIL: ${m}`); bad++; } };
  const meta = `slug: x\nstatus: ready\nchannels:\n  devto:     { status: pending, url: "", published: "", reactions: 0 }\n\n# --- export draft (canonical: https://dev.to/u/x-temp-slug-1) ---\n#   devto: draft https://dev.to/u/x-temp-slug-1\n`;
  const md = `---\nstatus: ready\nlive:\nurl_devto:\n---\nbody\n`;
  const devto = { status: "published", url: "https://dev.to/u/x-abc" };
  const a = syncOne({ meta, md, devto, logDate: "2026-09-26" });
  eq(/devto:\s+\{ status: published, url: "https:\/\/dev\.to\/u\/x-abc", published: "2026-09-26", reactions: 0 \}/.test(a.meta), true, "inline channel patched");
  eq(/temp-slug/.test(a.meta), false, "temp-slug stamp dropped");
  eq(/^url_devto: https:\/\/dev\.to\/u\/x-abc$/m.test(a.md), true, "front matter url");
  const b = syncOne({ ...a, devto, logDate: "2026-09-26" });
  eq(b.meta === a.meta && b.md === a.md, true, "idempotent");
  eq(syncOne({ meta, md, devto: { status: "draft", url: devto.url } }).meta === meta, true, "draft is not synced");
  const keep = dropStaleStamps(`# --- export publish (canonical: https://dev.to/u/x-abc) ---\n#   devto: published https://dev.to/u/x-abc\n`, "https://dev.to/u/x-abc");
  eq(keep.includes("export publish"), true, "matching stamp kept");
  if (bad) { console.error(`${bad} self-test failure(s)`); process.exitCode = 1; } else console.log("sync-state self-test: ok");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2);
  if (a.includes("--self-test")) selfTest();
  else {
    const i = a.indexOf("--state-root");
    const dry = a.includes("--dry-run");
    const ch = syncAll({ stateRoot: i >= 0 ? resolve(a[i + 1]) : ROOT, dry });
    console.log(`${dry ? "would sync" : "synced"} ${ch.length} lesson(s)${ch.length ? ":\n  " + ch.join("\n  ") : ""}`);
  }
}
