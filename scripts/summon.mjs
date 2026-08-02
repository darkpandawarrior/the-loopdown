#!/usr/bin/env node
// Summon: read a Kotlin codebase and report which of the cast are living in it.
//
//   node scripts/summon.mjs ~/Repos/Android/Mileway
//   node scripts/summon.mjs ~/Repos/Android/Mileway --entity the-messenger
//   node scripts/summon.mjs . --quiet          # counts only, no speeches
//
// This is a real linter wearing the lore. Every rule below is a genuine Android
// or Kotlin failure mode that lore/cast.md already personifies, so the character
// is not decoration bolted onto a warning: the character IS the warning, and has
// been since before this script existed.
//
// HONESTY, because the Borrowed Hand post exists: these are regex heuristics over
// text, not a parsed AST. They find candidates, not verdicts. A hit is an
// invitation to look, and every rule below states what it cannot see.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";

const root = process.argv[2] || ".";
const only = (process.argv.find((a) => a.startsWith("--entity=")) || "").split("=")[1]
  || (process.argv.includes("--entity") ? process.argv[process.argv.indexOf("--entity") + 1] : null);
const QUIET = process.argv.includes("--quiet");

const SKIP = /\/(build|\.git|\.gradle|node_modules|\.idea|generated)\//;
function kotlinFiles(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e);
    if (SKIP.test(p + "/")) continue;
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) kotlinFiles(p, out);
    else if (extname(p) === ".kt") out.push(p);
  }
  return out;
}

// Each rule: what it looks for, what it cannot see, and what the entity says.
const CAST = [
  {
    id: "the-messenger",
    name: "THE MESSENGER",
    className: "CancellationException",
    speech: "You caught me and logged that I looked upset. The work never stopped, it only stopped telling you.",
    blind: "cannot see whether the catch already rethrows CancellationException on a line above",
    scan: (src) => {
      if (!/\bsuspend\b/.test(src)) return [];
      const hits = [];
      const re = /catch\s*\(\s*\w+\s*:\s*(Exception|Throwable)\s*\)/g;
      let m;
      while ((m = re.exec(src))) {
        const after = src.slice(m.index, m.index + 400);
        if (/CancellationException/.test(after)) continue; // already handled nearby
        hits.push({ at: m.index, snippet: m[0] });
      }
      return hits;
    },
  },
  {
    id: "doze-the-jailer",
    name: "DOZE THE JAILER",
    className: "startForeground()",
    speech: "You had five seconds to explain why your work belonged here. You spent them reading from disk.",
    blind: "cannot tell how long the preceding statements actually take, only that they come first",
    scan: (src) => {
      const hits = [];
      const re = /override\s+fun\s+onStartCommand[\s\S]{0,1200}?\n\s{0,8}\}/g;
      let m;
      while ((m = re.exec(src))) {
        const body = m[0];
        const fg = body.indexOf("startForeground");
        if (fg < 0) continue;
        const before = body.slice(0, fg);
        // any call, assignment or launch ahead of the promise
        if (/\b(val|var)\s+\w+\s*=|\.\w+\(|launch\s*\{/.test(before.replace(/override\s+fun\s+onStartCommand[^\n]*\n/, "")))
          hits.push({ at: m.index, snippet: "work before startForeground()" });
      }
      return hits;
    },
  },
  {
    id: "the-recomposer",
    name: "THE RECOMPOSER",
    className: "@Composable",
    speech: "I repainted the whole room again. You handed me something I could not prove had stayed still.",
    blind: "cannot resolve whether a List is actually an ImmutableList alias, nor read the compiler's stability report",
    scan: (src) => {
      if (!/@Composable/.test(src)) return [];
      const hits = [];
      // an unkeyed lazy list is the cheapest real recomposition bug there is
      const lazy = /\b(items|itemsIndexed)\s*\(\s*[^)]*?\)\s*\{/g;
      let m;
      while ((m = lazy.exec(src))) {
        if (!/key\s*=/.test(m[0])) hits.push({ at: m.index, snippet: "items( ) with no key =" });
      }
      // a raw List parameter into a composable is unstable to the compiler
      const param = /@Composable[\s\S]{0,300}?fun\s+\w+\s*\(([^)]*)\)/g;
      while ((m = param.exec(src))) {
        if (/:\s*(List|Map|Set)</.test(m[1])) hits.push({ at: m.index, snippet: "unstable List/Map/Set parameter" });
      }
      return hits;
    },
  },
  {
    id: "the-ferryman",
    name: "THE FERRYMAN",
    className: "Migration(23, 24)",
    speech: "I rowed that crossing and nobody watched. There is no return fare.",
    blind: "counts declared migrations against test files by name only; a differently named test is invisible to it",
    dedupe: true,   // one migration is one sighting repo-wide, not one per file that mentions it
    scan: (src, path, all) => {
      // Only a DEFINITION counts. The database builder lists all 47 by reference,
      // which the first version of this rule happily reported as 37 untested
      // crossings in a file that declares none of them.
      const defs = [...src.matchAll(/(?:object|val)\s+MIGRATION_(\d+)_(\d+)/g)].map((m) => `${m[1]}_${m[2]}`);
      if (!defs.length || /Test\.kt$/.test(path)) return [];
      const tested = new Set(all.tested);
      return [...new Set(defs)].filter((d) => !tested.has(d)).map((d) => ({ at: 0, snippet: `MIGRATION_${d} has no test` }));
    },
  },
  {
    id: "null",
    name: "NULL",
    className: "T?",
    speech: "You promised the compiler I would not be here. You did not check.",
    blind: "counts !! only; it cannot tell a genuinely-proven non-null from a hopeful one",
    scan: (src) =>
      [...src.matchAll(/[\w\)\]]\s*!!/g)].map((m) => ({ at: m.index, snippet: "!!" })),
  },
  {
    id: "the-vault-keeper",
    name: "THE VAULT KEEPER",
    className: "AndroidKeyStore",
    speech: "A key kept where anyone can read it was never a key. It was a formality.",
    blind: "string heuristics only; it cannot tell a real secret from a placeholder or a test fixture",
    scan: (src, path) => {
      // A DataStore/SharedPreferences key NAMED "KEY_..." is not a secret. The
      // first version of this rule reported 18 of them in one settings file.
      if (/Test\.kt$|preferencesKey|stringPreferencesKey/.test(path + src.slice(0, 4000))) {
        if (/Test\.kt$/.test(path)) return [];
      }
      const hits = [];
      const re = /\b(val|const val)\s+(\w*(?:KEY|SECRET|TOKEN|PASSWORD|PASSPHRASE)\w*)\s*(?::\s*String\s*)?=\s*"([^"]{8,})"/gi;
      let m;
      while ((m = re.exec(src))) {
        const value = m[3];
        if (/^(android|content|http|BuildConfig|\$\{)/i.test(value)) continue;
        // a lower_snake_case value is a preference key or an analytics name, not a credential
        if (/^[a-z0-9]+(_[a-z0-9]+)*$/.test(value)) continue;
        // real secrets are high-entropy: demand mixed case or digits plus length
        if (!(/[A-Z]/.test(value) && /[a-z]/.test(value)) && !/\d/.test(value)) continue;
        if (value.length < 16) continue;
        hits.push({ at: m.index, snippet: `hardcoded ${m[2]}` });
      }
      return hits;
    },
  },
  {
    id: "the-understudy",
    name: "THE UNDERSTUDY",
    className: "actual",
    speech: "You cast me by name at compile time. Now you would like a rehearsal, and there is no swapping me out.",
    blind: "flags every expect declaration; some of them genuinely want to be a weld",
    scan: (src) => [...src.matchAll(/^\s*expect\s+(fun|class|object|val)\s/gm)].map((m) => ({ at: m.index, snippet: m[0].trim() })),
  },
];

// ── run ─────────────────────────────────────────────────────────────────────
const files = kotlinFiles(root);
if (!files.length) { console.log(`no .kt files under ${root}`); process.exit(0); }

// migration tests are a cross-file fact, so gather it once up front
const tested = new Set();
for (const f of files) {
  if (!/Migration.*Test\.kt$/i.test(f)) continue;
  const s = readFileSync(f, "utf8");
  for (const m of s.matchAll(/MIGRATION_(\d+)_(\d+)/g)) tested.add(`${m[1]}_${m[2]}`);
  for (const m of s.matchAll(/(\d+)\s*,\s*(\d+)/g)) tested.add(`${m[1]}_${m[2]}`);
}

const found = new Map();
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const c of CAST) {
    if (only && c.id !== only) continue;
    let hits = [];
    try { hits = c.scan(src, f, { tested }) || []; } catch { hits = []; }
    if (!hits.length) continue;
    const rec = found.get(c.id) || { c, total: 0, files: new Map(), seen: new Set() };
    if (c.dedupe) {
      const fresh = hits.filter((h) => !rec.seen.has(h.snippet));
      fresh.forEach((h) => rec.seen.add(h.snippet));
      if (!fresh.length) continue;
      rec.total += fresh.length;
      rec.files.set(relative(root, f), fresh.length);
    } else {
      rec.total += hits.length;
      rec.files.set(relative(root, f), hits.length);
    }
    found.set(c.id, rec);
  }
}

console.log(`\n  scanned ${files.length} Kotlin files under ${root}\n`);
if (!found.size) { console.log("  nobody answered. Either the codebase is clean or the summons was too narrow.\n"); process.exit(0); }

const order = [...found.values()].sort((a, b) => b.total - a.total);
for (const { c, total, files: fmap } of order) {
  const top = [...fmap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  console.log(`  ${c.name}  (${c.className})  ${total} sighting${total === 1 ? "" : "s"} in ${fmap.size} file${fmap.size === 1 ? "" : "s"}`);
  if (!QUIET) {
    console.log(`     "${c.speech}"`);
    for (const [f, n] of top) console.log(`       ${n}x  ${f}`);
    if (fmap.size > top.length) console.log(`       ... and ${fmap.size - top.length} more`);
    console.log(`       blind spot: ${c.blind}`);
  }
  console.log("");
}
console.log(`  ${order.reduce((a, r) => a + r.total, 0)} sightings total. These are heuristics over text, not a parsed AST.`);
console.log(`  Every one of them is a candidate to look at, never a verdict.\n`);
