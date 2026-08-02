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

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const lessonsDir = join(ROOT, "lessons");

const meta = (d) => { const p = join(lessonsDir, d, "meta.yaml"); return existsSync(p) ? readFileSync(p, "utf8") : ""; };
const devtoUrl = (d) => (meta(d).match(/(https:\/\/dev\.to\/\S+)/) || [])[1] || "";
const linkedinDone = (d) => /linkedin:[\s\S]{0,240}?url:\s*"?https/.test(meta(d));
const isReady = (d) => /^status:\s*(ready|published)\s*$/m.test(meta(d));

const all = readdirSync(lessonsDir).filter((d) => /^\d{4}-\d{2}-\d{2}-/.test(d)).sort();
const pending = all.filter((d) => isReady(d) && !linkedinDone(d));
if (!pending.length) { console.log("nothing pending for LinkedIn."); process.exit(0); }

// prefer one that is already on dev.to, so the comment has something to link
const next = pending.find((d) => devtoUrl(d)) || pending[0];
const url = devtoUrl(next);

// the previous post that DID go out on LinkedIn, for the series callback
const prevLi = all.filter(linkedinDone).pop();
const prevLiUrl = prevLi ? (meta(prevLi).match(/linkedin:[\s\S]*?url:\s*"?(https:\/\/[^"\s]+)/) || [])[1] : "";

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

const out = `# LinkedIn queue

Prepared ${new Date().toISOString().slice(0, 16).replace("T", " ")}. ${pending.length} post(s) pending.

## Up next: ${title}

- [ ] New post, paste the text below
- [ ] Attach a **document** and upload \`${existsSync(pdf) ? pdf : "(run: node scripts/carousel.mjs lessons/" + next + ")"}\`
- [ ] Post it
- [ ] First comment: paste the links block
- [ ] Reply to every comment for the first 2 hours
- [ ] Record the URL in \`lessons/${next}/meta.yaml\` and set the linkedin status

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

try {
  execFileSync("osascript", ["-e",
    `display notification "${title.replace(/"/g, "")}" with title "The Loopdown" subtitle "LinkedIn post ready to paste"`]);
} catch {}
