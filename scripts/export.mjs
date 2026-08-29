#!/usr/bin/env node
// Publish a lesson as a CONNECTED cross-platform campaign. SAFE BY DEFAULT: dry-run.
//
//   node scripts/export.mjs lessons/<dir>              # dry-run: plan + paste files, no network
//   node scripts/export.mjs lessons/<dir> --draft      # dev.to + Medium drafts (reviewable)
//   node scripts/export.mjs lessons/<dir> --publish     # go live (explicit)
//   ...add --only devto,hashnode,medium,linkedin to limit channels
//
// Continuity built in: one canonical home, a consistent branded footer on every
// article, cross-links (LinkedIn → long-form), and "previously in this series"
// threading pulled from data/registry.json.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, basename, join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { get, has } from "./lib/config.mjs";
import { parseFrontmatter } from "./lib/frontmatter.mjs";
import { loadProfile, buildFooter, linkedinCrossLink } from "./lib/profile.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const lessonDir = argv.find((a) => !a.startsWith("--"));
const flag = (n) => argv.includes(`--${n}`);
const opt = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : ""; };
if (!lessonDir) { console.error("usage: node scripts/export.mjs lessons/<dir> [--draft|--publish] [--only a,b]"); process.exit(1); }

const mode = flag("publish") ? "publish" : flag("draft") ? "draft" : "dry-run";
const only = opt("only") ? opt("only").split(",").map((s) => s.trim()) : ["devto", "hashnode", "medium", "linkedin"];
const want = (c) => only.includes(c);
const live = mode === "publish";

// --- read the lesson + profile + registry ---
const read = (f) => (existsSync(resolve(lessonDir, f)) ? readFileSync(resolve(lessonDir, f), "utf8") : "");
const lesson = parseFrontmatter(read("lesson.md"));
const article = parseFrontmatter(read("article.md"));
const linkedinRaw = read("linkedin.md").replace(/^<!--[\s\S]*?-->\s*/g, "").trim();
const profile = loadProfile();
const fm = lesson.fm;
const title = fm.title || article.fm.title || basename(lessonDir);
const slug = fm.slug || basename(lessonDir).replace(/^\d{4}-\d{2}-\d{2}-/, "");
const tags = (Array.isArray(fm.tags) ? fm.tags : []).map((t) => t.replace(/[^a-z0-9]/gi, "").toLowerCase()).filter(Boolean).slice(0, 4);
const relLesson = relative(ROOT, resolve(lessonDir)); // repo-relative, e.g. lessons/2026-... (no leading ../)
const cover = has("GITHUB_ASSET_BASE_URL") ? `${get("GITHUB_ASSET_BASE_URL").replace(/\/$/, "")}/${relLesson}/assets/card.png` : "";

// Articles can reference their own art with ordinary relative markdown
// (`![alt](assets/carousel/slide-02.png)`). Remote platforms cannot resolve
// that, so rewrite every relative asset path to its absolute GitHub raw URL on
// the way out. Keeps article.md readable in the repo and on GitHub, and means
// the carousel art actually reaches dev.to instead of dying as a cover image.
const absolutiseAssets = (md) =>
  has("GITHUB_ASSET_BASE_URL")
    ? md.replace(/\]\((\.\/)?assets\//g, `](${get("GITHUB_ASSET_BASE_URL").replace(/\/$/, "")}/${relLesson}/assets/`)
    : md;

// dev.to (and Hashnode) render a single newline as a <br>, so a paragraph that
// was hard-wrapped at 90 columns in the source ships with a ragged break after
// every line. Reflow plain paragraphs into one line each on the way out, while
// leaving verbatim everything where a line break is load-bearing: fenced code,
// lists, quotes, headings, tables, indented blocks, and explicit two-space
// hard breaks. The source stays comfortable to edit; the platform gets prose.
function reflowParagraphs(md) {
  const out = [];
  let inFence = false, para = [];
  const flush = () => { if (para.length) { out.push(para.join(" ")); para = []; } };
  const verbatim = (l) =>
    /^\s{4,}\S/.test(l) ||                       // indented block / list continuation
    /^\s*(#{1,6}\s|>|[-*+]\s|\d+[.)]\s|\|)/.test(l) || // heading, quote, list, table
    /^\s*(<|!\[)/.test(l) ||                     // raw HTML, image on its own line
    /^\s*[-*_]{3,}\s*$/.test(l);                 // horizontal rule

  for (const line of md.split("\n")) {
    if (/^\s*```/.test(line)) { flush(); inFence = !inFence; out.push(line); continue; }
    if (inFence) { out.push(line); continue; }
    if (line.trim() === "") { flush(); out.push(""); continue; }
    if (verbatim(line)) { flush(); out.push(line); continue; }
    if (/ {2}$/.test(line)) { para.push(line.trimEnd()); flush(); continue; } // explicit hard break
    para.push(line.trim());
  }
  flush();
  return out.join("\n");
}

const articleBody = reflowParagraphs(absolutiseAssets(article.body || lesson.body));

// --- previous-in-series (continuity) from registry.json ---
let prev = null, seriesIndexUrl = "";
const regPath = join(ROOT, "data", "registry.json");
if (fm.series && existsSync(regPath)) {
  const reg = JSON.parse(readFileSync(regPath, "utf8"));
  const sameSeries = (reg.lessons || []).filter((l) => l.series === fm.series && l.slug !== slug && String(l.created) < String(fm.created)).sort((a, b) => String(b.created).localeCompare(String(a.created)));
  if (sameSeries[0] && profile.url_github) prev = { title: sameSeries[0].title, url: `${profile.url_github.replace(/\/$/, "")}/blob/main/${sameSeries[0].file.replace(/lesson\.md$/, "article.md")}` };
  if (profile.url_github) seriesIndexUrl = `${profile.url_github.replace(/\/$/, "")}/blob/main/series/${fm.series}.md`;
}

// --- canonical strategy ---
const explicitCanonical =
  has("CANONICAL_BASE_URL") ? `${get("CANONICAL_BASE_URL").replace(/\/$/, "")}/${slug}`
  : (profile.canonical_strategy === "site" && profile.url_site) ? `${profile.url_site.replace(/\/$/, "")}/the-loopdown/${slug}`
  : ""; // "auto" → dev.to becomes canonical, resolved after it publishes

const footerFor = (canonicalUrl) => buildFooter(profile, fm, { canonicalUrl, prev, seriesIndexUrl });

const outDir = resolve(lessonDir, "out");
mkdirSync(outDir, { recursive: true });
const results = {};
const log = (c, msg) => console.log(`  [${c}] ${msg}`);
async function post(url, opts) { const r = await fetch(url, opts); const body = await r.text(); let json; try { json = JSON.parse(body); } catch {} return { status: r.status, json, body }; }

// Publish state (dev.to article id etc.) so re-runs UPDATE instead of creating duplicates.
const statePath = resolve(lessonDir, "state.json");
const loadState = () => (existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : {});
const saveState = (patch) => writeFileSync(statePath, JSON.stringify({ ...loadState(), ...patch }, null, 2) + "\n");
// Adopt an already-created dev.to article (e.g. a draft from a prior run) by exact title.
async function findDevtoIdByTitle(t) {
  try {
    const r = await post("https://dev.to/api/articles/me/all?per_page=100", { headers: { "api-key": get("DEVTO_API_KEY") } });
    return Array.isArray(r.json) ? r.json.find((a) => a.title === t)?.id : undefined;
  } catch { return undefined; }
}

console.log(`\n  campaign: "${title}"  ·  mode: ${mode}  ·  channels: ${only.join(", ")}`);
console.log(`  canonical: ${explicitCanonical || "auto (dev.to becomes the original)"}${prev ? `  ·  prev-in-series: ${prev.title}` : ""}\n`);

let canonicalResolved = explicitCanonical; // dev.to may fill this under "auto"

// --- dev.to (published first so it can seed the canonical URL under "auto") ---
if (want("devto")) {
  const body = articleBody + "\n" + footerFor(explicitCanonical); // on the original, footer omits self-link when explicit is empty
  if (mode === "dry-run") { log("devto", `would ${has("DEVTO_API_KEY") ? (live ? "publish" : "draft") : "SKIP (no token)"} · tags: ${tags.join(",")}`); }
  else if (!has("DEVTO_API_KEY")) { log("devto", "skip — no DEVTO_API_KEY"); }
  else {
    // tags MUST be an array. Passing the comma string makes dev.to accept the
    // request and silently drop every tag (post 002 shipped untagged that way).
    // NEVER downgrade a live post to a draft.
    //
    // `--draft` sends published:false, and the PUT reuses the SAME article id
    // that `--publish` created — which is what makes draft-then-publish
    // idempotent. It also means running --draft over an article that is
    // already out UNPUBLISHES it. Re-staging all seventeen to pick up new
    // figures did exactly that: three live posts silently became drafts and
    // their public URLs stopped resolving.
    //
    // Publishing is one-way here. If the post is live and this run is a draft
    // run, keep it live and update the body.
    // Ask dev.to, do not trust local state.
    //
    // The first version of this guard read state.json — and state.json can be
    // wrong about the very thing being guarded. It was: a --draft run recorded
    // status "draft" for a post it had left published, the next --draft run
    // read that, believed the article was a draft, and unpublished it for
    // real. A guard whose evidence is the thing it is protecting is not a
    // guard.
    //
    // The platform is the authority on whether a post is live. If that lookup
    // fails, fall back to local state and then to the flag — an unreachable
    // API must not become a reason to unpublish.
    let wasPublished = loadState().devto?.status === "published";
    const knownId = loadState().devto?.id;
    if (knownId) {
      try {
        // The LISTING, not /articles/{id}. The single-article endpoint does not
        // return a `published` field at all — it was checked, the guard read
        // undefined, fell back to the corrupted local state and unpublished a
        // live post anyway. /articles/me/all does return it, for drafts and
        // published alike.
        const check = await post("https://dev.to/api/articles/me/all?per_page=100", {
          method: "GET", headers: { "api-key": get("DEVTO_API_KEY") },
        });
        const mine = Array.isArray(check.json) ? check.json.find((a) => a.id === knownId) : null;
        if (mine && typeof mine.published === "boolean") wasPublished = mine.published;
      } catch { /* keep the local guess rather than risk an unpublish */ }
    }
    const publishFlag = live || wasPublished;
    if (!live && wasPublished) log("devto", "already published: updating in place, not reverting to draft");

    const payload = { article: { title, body_markdown: body, published: publishFlag, tags, series: fm.series || null, main_image: cover || null, canonical_url: explicitCanonical || null } };
    try {
      // Reuse an existing article if we have one (idempotent: draft → publish updates the SAME post).
      let id = loadState().devto?.id;
      if (!id) id = await findDevtoIdByTitle(title);
      const url = id ? `https://dev.to/api/articles/${id}` : "https://dev.to/api/articles";
      const method = id ? "PUT" : "POST";
      const r = await post(url, { method, headers: { "api-key": get("DEVTO_API_KEY"), "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (r.status === 200 || r.status === 201) { // Report what the post IS, not what the flag asked for: a --draft run
        // over a live article keeps it published, and a log that called that
        // "draft" would be lying about the one thing worth knowing.
        results.devto = { status: publishFlag ? "published" : "draft", url: r.json?.url || "" }; if (r.json?.id) saveState({ devto: { id: r.json.id, url: r.json.url, status: results.devto.status } }); if (!canonicalResolved && r.json?.url) canonicalResolved = r.json.url; log("devto", `${results.devto.status} (${method === "PUT" ? "updated" : "created"}): ${results.devto.url}`);
        // dev.to drops the whole set if any single tag is invalid, and still returns 200.
        const landed = r.json?.tags || [];
        if (tags.length && !landed.length) log("devto", `WARNING: tags were rejected (sent ${tags.join(",")}). Set valid ones on the post or fix lesson.md frontmatter.`);
      }
      else log("devto", `FAILED HTTP ${r.status}: ${r.body.slice(0, 160)}`);
    } catch (e) { log("devto", `error: ${e.message}`); }
  }
}

// --- Hashnode (FREE path = paste/import; its publish API needs Hashnode Pro) ---
if (want("hashnode")) {
  const body = `# ${title}\n\n` + articleBody + "\n" + footerFor(canonicalResolved);
  writeFileSync(resolve(outDir, "hashnode.md"), body + "\n"); // free: paste or import from canonical
  const pro = has("HASHNODE_TOKEN") && has("HASHNODE_PUBLICATION_ID");
  if (!pro) {
    log("hashnode", `paste/import → out/hashnode.md${canonicalResolved ? "  (import from " + canonicalResolved + ")" : "  (API needs Hashnode Pro)"}`);
  } else if (mode === "dry-run") {
    log("hashnode", `would publish via API (Pro token present)${canonicalResolved ? " · canonical→" + canonicalResolved : ""}`);
  } else {
    const mutation = `mutation Publish($input: PublishPostInput!) { publishPost(input: $input) { post { url } } }`;
    const input = { title, contentMarkdown: body, publicationId: get("HASHNODE_PUBLICATION_ID"), tags: tags.map((t) => ({ slug: t, name: t })), ...(canonicalResolved ? { originalArticleURL: canonicalResolved } : {}), ...(cover ? { coverImageOptions: { coverImageURL: cover } } : {}) };
    try {
      const r = await post("https://gql.hashnode.com", { method: "POST", headers: { "Content-Type": "application/json", Authorization: get("HASHNODE_TOKEN") }, body: JSON.stringify({ query: mutation, variables: { input } }) });
      const url = r.json?.data?.publishPost?.post?.url;
      if (url) { results.hashnode = { status: "published", url }; log("hashnode", `published: ${url}`); }
      // Not a guess any more. Hashnode retired free API access on 2026-05-13;
      // without Pro the endpoint answers a POST with a 301 to that
      // announcement rather than a GraphQL error, so `r.json` is empty and
      // there is no message to quote.
      else if (!r.json) log("hashnode", `SKIPPED: free API access was retired 2026-05-13, publishing needs Pro. out/hashnode.md is ready to import instead.`);
      else log("hashnode", `FAILED: ${r.json?.errors?.[0]?.message || "HTTP " + r.status}`);
    } catch (e) { log("hashnode", `error: ${e.message}`); }
  }
}

// --- Medium (legacy API; token may not be mintable on newer accounts) ---
if (want("medium")) {
  const body = `# ${title}\n\n` + articleBody + "\n" + footerFor(canonicalResolved);
  writeFileSync(resolve(outDir, "medium.md"), body + "\n"); // always leave a paste/import file
  const ready = has("MEDIUM_TOKEN") && has("MEDIUM_USER_ID");
  if (mode === "dry-run") { log("medium", `paste/import → out/medium.md${ready ? "  (+ API ready)" : "  (no token — use medium.com/p/import from the dev.to URL)"}`); }
  else if (!ready) { log("medium", `no MEDIUM_TOKEN/USER_ID — paste out/medium.md or import from ${canonicalResolved || "the published URL"}`); }
  else {
    const payload = { title, contentFormat: "markdown", content: body, tags: tags.slice(0, 3), canonicalUrl: canonicalResolved || undefined, publishStatus: live ? "public" : "draft" };
    try {
      const r = await post(`https://api.medium.com/v1/users/${get("MEDIUM_USER_ID")}/posts`, { method: "POST", headers: { Authorization: `Bearer ${get("MEDIUM_TOKEN")}`, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
      const url = r.json?.data?.url;
      if (url) { results.medium = { status: live ? "published" : "draft", url }; log("medium", `${results.medium.status}: ${url}`); }
      else log("medium", `FAILED HTTP ${r.status}: ${r.body.slice(0, 160)}`);
    } catch (e) { log("medium", `error: ${e.message}`); }
  }
}

// --- LinkedIn (paste file, now with the resolved long-form cross-link baked in) ---
if (want("linkedin")) {
  const bestUrl = canonicalResolved || results.hashnode?.url || results.medium?.url || "";
  let li = linkedinRaw;
  if (bestUrl) {
    // insert the cross-link just before the trailing hashtag block, else append
    const hashIdx = li.search(/\n#[^\n]*$/);
    li = hashIdx >= 0 ? li.slice(0, hashIdx) + linkedinCrossLink(bestUrl) + "\n" + li.slice(hashIdx + 1) : li + linkedinCrossLink(bestUrl);
  }
  writeFileSync(resolve(outDir, "linkedin.txt"), li + "\n");
  log("linkedin", `paste-ready → out/linkedin.txt${bestUrl ? "  (full-writeup link embedded)" : ""}`);
  if (mode !== "dry-run" && has("BUFFER_ACCESS_TOKEN") && has("BUFFER_LINKEDIN_PROFILE_ID")) {
    try {
      const params = new URLSearchParams({ "profile_ids[]": get("BUFFER_LINKEDIN_PROFILE_ID"), text: li, access_token: get("BUFFER_ACCESS_TOKEN") });
      if (live) params.set("now", "true");
      const r = await post("https://api.bufferapp.com/1/updates/create.json", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString() });
      if (r.json?.success) { results.linkedin = { status: live ? "published" : "queued" }; log("linkedin", `Buffer: ${results.linkedin.status}`); }
      else log("linkedin", `Buffer failed: ${r.body.slice(0, 140)}`);
    } catch (e) { log("linkedin", `Buffer error: ${e.message}`); }
  }
}

/**
 * Record the publish in lesson.md's FRONT-MATTER, which is the canonical
 * record everything downstream reads.
 *
 * scripts/build-registry.mjs builds data/registry.json from these front-matter
 * keys (`url_devto`, `url_linkedin`, ...), and cv-siddharth's gen-loopdown.mjs
 * pulls that registry to build the site's outbound links. The publisher wrote
 * none of them: it appended a comment to meta.yaml and wrote state.json, so a
 * lesson that had genuinely gone out still read `status: ready` with no url
 * anywhere the registry looks.
 *
 * The visible consequence was the whole complaint: articles get published and
 * the site never links them, because the only machine-readable trace lived in
 * a file no generator reads.
 */
function recordInFrontMatter(lessonDir, results, canonical) {
  const mdPath = resolve(lessonDir, "lesson.md");
  if (!existsSync(mdPath)) return;
  const md = readFileSync(mdPath, "utf8");
  const m = /^---\n([\s\S]*?)\n---/.exec(md);
  if (!m) return;

  let fm = m[1];
  const setKey = (key, value) => {
    const re = new RegExp(`^${key}:.*$`, "m");
    fm = re.test(fm) ? fm.replace(re, `${key}: ${value}`) : `${fm}\n${key}: ${value}`;
  };

  let anyPublished = false;
  for (const [channel, r] of Object.entries(results)) {
    if (r.status !== "published" || !r.url) continue;
    anyPublished = true;
    setKey(`url_${channel}`, r.url);
  }
  if (!anyPublished) return;

  setKey("status", "published");
  setKey("published", new Date().toISOString().slice(0, 10));
  // `live` is the canonical destination a reader is sent to.
  if (canonical || results.devto?.url) setKey("live", canonical || results.devto.url);

  writeFileSync(mdPath, md.slice(0, m.index) + `---\n${fm}\n---` + md.slice(m.index + m[0].length));
  console.log("  recorded in lesson.md front-matter");
}

/**
 * Record the result in meta.yaml — in the STRUCTURED fields, not only as a
 * trailing comment.
 *
 * This used to append a `# --- export publish ---` comment block and nothing
 * else, so a lesson that had genuinely gone out still read
 * `status: ready` with `devto: { status: pending, url: "" }`. Two things
 * followed from that, and both were live:
 *
 *   1. cv-siddharth's gen-loopdown.mjs reads these channel fields to build the
 *      site's outbound links. A published post therefore appeared on the site
 *      with no link to itself — which is exactly "we have articles but none of
 *      them are linked".
 *   2. `status:` stayed `ready`, so the queue never shrank in the file a human
 *      reads. (Re-publishing was never a risk — state.json carries the article
 *      id and publish-next checks it — but the file said the opposite of the
 *      truth.)
 *
 * The comment block stays: it is the human-readable audit trail, and it
 * records the canonical URL choice. What is added is the machine-readable half
 * that everything downstream actually consumes.
 */
if (Object.keys(results).length) {
  recordInFrontMatter(lessonDir, results, canonicalResolved);
  const metaPath = resolve(lessonDir, "meta.yaml");
  if (existsSync(metaPath)) {
    let meta = readFileSync(metaPath, "utf8");
    let published = false;

    for (const [channel, r] of Object.entries(results)) {
      if (r.status !== "published" || !r.url) continue;
      published = true;
      // Rewrite just this channel's inline mapping, leaving the rest of the
      // line's keys (impressions, reactions, ...) exactly as they are.
      const line = new RegExp(`^(\\s*${channel}:\\s*\\{)([^}]*)(\\})`, "m");
      if (line.test(meta)) {
        meta = meta.replace(line, (_m, open, body, close) => {
          const patched = body
            .replace(/status:\s*[a-z]+/, "status: published")
            .replace(/url:\s*""/, `url: "${r.url}"`)
            .replace(/published:\s*""/, `published: "${new Date().toISOString().slice(0, 10)}"`);
          return open + patched + close;
        });
      }
    }

    // A lesson is published once ANY channel carries it.
    if (published) meta = meta.replace(/^status:\s*ready\s*$/m, "status: published");

    const stamp = `\n# --- export ${mode} (canonical: ${canonicalResolved || "n/a"}) ---\n` + Object.entries(results).map(([c, r]) => `#   ${c}: ${r.status}${r.url ? " " + r.url : ""}`).join("\n") + "\n";
    writeFileSync(metaPath, meta + stamp);
  }
  console.log(`\n  logged to meta.yaml`);
}
console.log(mode === "dry-run" ? "\n  dry-run only — no network publish. Re-run with --draft or --publish.\n" : "\n  done.\n");
