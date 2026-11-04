#!/usr/bin/env node
// Prepare the next LinkedIn post and put it somewhere you will actually see it.
//
//   node scripts/linkedin-next.mjs
//
// LinkedIn has no publishing API worth using for document posts, so this does
// NOT post. It assembles the packet (text, carousel path, first comment) into
// data/linkedin-queue.md and raises a desktop notification. Posting stays a
// deliberate human act, which is also the correct place for a last read.
//
// Preference order: a lesson already live on dev.to (so the first comment can
// link the full write-up), oldest first. Falls back to any ready lesson.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { linkedinUrl, stalenessDecision } from "./lib/linkedin.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const lessonsDir = join(ROOT, "lessons");

const meta = (d) => { const p = join(lessonsDir, d, "meta.yaml"); return existsSync(p) ? readFileSync(p, "utf8") : ""; };
const devtoUrl = (d) => (meta(d).match(/(https:\/\/dev\.to\/\S+)/) || [])[1] || "";
const linkedinDone = (d) => /^https/.test(linkedinUrl(meta(d)));
const isReady = (d) => /^status:\s*(ready|published)\s*$/m.test(meta(d));

const all = readdirSync(lessonsDir).filter((d) => /^\d{4}-\d{2}-\d{2}-/.test(d)).sort();
const pending = all.filter((d) => isReady(d) && !linkedinDone(d));
if (!pending.length) { console.log("nothing pending for LinkedIn."); process.exit(0); }

// prefer one that is already on dev.to, so the comment has something to link
const next = pending.find((d) => devtoUrl(d)) || pending[0];
const url = devtoUrl(next);

// the previous post that DID go out on LinkedIn, for the series callback
const prevLi = all.filter(linkedinDone).pop();
const prevLiUrl = prevLi ? linkedinUrl(meta(prevLi)) : "";

const textPath = join(lessonsDir, next, "out", "linkedin.txt");
const body = existsSync(textPath)
  ? readFileSync(textPath, "utf8").trim()
  : readFileSync(join(lessonsDir, next, "linkedin.md"), "utf8").replace(/^<!--[\s\S]*?-->\n*/, "").trim();

// LinkedIn throttles posts carrying an external link in the body, so the link
// belongs in the first comment. Strip it out of the paste and hand it over
// separately rather than quietly leaving it in.
const bodyNoLink = body.replace(/^.*(?:Full write-up|📖).*$/gm, "").replace(/\n{3,}/g, "\n\n").trim();

const pdf = join(lessonsDir, next, "assets", "carousel.pdf");
const title = (readFileSync(join(lessonsDir, next, "lesson.md"), "utf8").match(/title:\s*"?([^"\n]+)"?/) || [])[1] || next;

// How long has this same post been waiting? The clock starts the first time a lesson
// is "Up next" and resets only when a different lesson takes the slot (post-done does that).
const statePath = join(ROOT, "data", "linkedin-state.json");
let prevState = null;
try { prevState = JSON.parse(readFileSync(statePath, "utf8")); } catch {}
const wait = stalenessDecision(prevState, next);
writeFileSync(statePath, JSON.stringify(wait.state, null, 2) + "\n");
const waitDays = Math.max(wait.days, 2);
const nag = wait.stale ? `waiting ${waitDays} days, ${pending.length} queued` : "";
const banner = nag ? `> **STALE: this post has been ${nag}.** Paste it, then run \`npm run post-done <url>\` in scripts/.\n\n` : "";

const out = `${banner}# LinkedIn queue

Prepared ${new Date().toISOString().slice(0, 16).replace("T", " ")}. ${pending.length} post(s) pending.

## Up next: ${title}

- [ ] New post, paste the text below
- [ ] Attach a **document** and upload \`${existsSync(pdf) ? pdf : "(run: node scripts/carousel.mjs lessons/" + next + ")"}\`
- [ ] Post it
- [ ] First comment: paste the links block
- [ ] Reply to every comment for the first 2 hours
- [ ] Record it: \`cd scripts && npm run post-done <the post URL>\` (updates \`lessons/${next}/meta.yaml\` and moves the queue on)

### The post

\`\`\`
${bodyNoLink}
\`\`\`

### First comment (keeps the link out of the body)

\`\`\`
${url ? `Full write-up: ${url}` : "(not on dev.to yet, publish there first or drop this line)"}${prevLiUrl ? `\nThe previous one, ${prevLi.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/-/g, " ")}: ${prevLiUrl}` : ""}
\`\`\`

---

Still pending after this: ${pending.filter((d) => d !== next).map((d) => d.replace(/^\d{4}-\d{2}-\d{2}-/, "")).join(", ") || "nothing"}
`;

const outPath = join(ROOT, "data", "linkedin-queue.md");
writeFileSync(outPath, out);
console.log(`prepared: ${title}\n  -> ${outPath}`);

// Notification only, never `display alert`: an alert is modal and blocks the run.
const subtitle = nag ? `LinkedIn post ${nag}` : "LinkedIn post ready to paste";
try {
  execFileSync("osascript", ["-e",
    `display notification "${title.replace(/"/g, "")}" with title "The Loopdown" subtitle "${subtitle}"`]);
} catch {}
// Stale: also open the queue file once per run so it cannot stay out of sight.
if (nag) { try { execFileSync("open", [outPath]); } catch {} }
