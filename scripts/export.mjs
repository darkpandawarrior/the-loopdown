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
const articleBody = article.body || lesson.body;
const relLesson = relative(ROOT, resolve(lessonDir)); // repo-relative, e.g. lessons/2026-... (no leading ../)
const cover = has("GITHUB_ASSET_BASE_URL") ? `${get("GITHUB_ASSET_BASE_URL").replace(/\/$/, "")}/${relLesson}/assets/card.png` : "";

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

console.log(`\n  campaign: "${title}"  ·  mode: ${mode}  ·  channels: ${only.join(", ")}`);
console.log(`  canonical: ${explicitCanonical || "auto (dev.to becomes the original)"}${prev ? `  ·  prev-in-series: ${prev.title}` : ""}\n`);

let canonicalResolved = explicitCanonical; // dev.to may fill this under "auto"

// --- dev.to (published first so it can seed the canonical URL under "auto") ---
if (want("devto")) {
  const body = articleBody + "\n" + footerFor(explicitCanonical); // on the original, footer omits self-link when explicit is empty
  if (mode === "dry-run") { log("devto", `would ${has("DEVTO_API_KEY") ? (live ? "publish" : "draft") : "SKIP (no token)"} · tags: ${tags.join(",")}`); }
  else if (!has("DEVTO_API_KEY")) { log("devto", "skip — no DEVTO_API_KEY"); }
  else {
    const payload = { article: { title, body_markdown: body, published: live, tags: tags.join(","), series: fm.series || null, main_image: cover || null, canonical_url: explicitCanonical || null } };
    try {
      const r = await post("https://dev.to/api/articles", { method: "POST", headers: { "api-key": get("DEVTO_API_KEY"), "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (r.status === 201) { results.devto = { status: live ? "published" : "draft", url: r.json?.url || "" }; if (!canonicalResolved && r.json?.url) canonicalResolved = r.json.url; log("devto", `${results.devto.status}: ${results.devto.url}`); }
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
      else log("hashnode", `FAILED (Pro required?): ${r.json?.errors?.[0]?.message || "HTTP " + r.status}`);
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

// --- log results into meta.yaml ---
if (Object.keys(results).length) {
  const stamp = `\n# --- export ${mode} (canonical: ${canonicalResolved || "n/a"}) ---\n` + Object.entries(results).map(([c, r]) => `#   ${c}: ${r.status}${r.url ? " " + r.url : ""}`).join("\n") + "\n";
  const metaPath = resolve(lessonDir, "meta.yaml");
  if (existsSync(metaPath)) writeFileSync(metaPath, readFileSync(metaPath, "utf8") + stamp);
  console.log(`\n  logged to meta.yaml`);
}
console.log(mode === "dry-run" ? "\n  dry-run only — no network publish. Re-run with --draft or --publish.\n" : "\n  done.\n");
