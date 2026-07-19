#!/usr/bin/env node
// Publish a lesson across channels. SAFE BY DEFAULT: dry-run unless told otherwise.
//
//   node scripts/export.mjs lessons/<dir>              # dry-run: plan + paste files, no network
//   node scripts/export.mjs lessons/<dir> --draft      # dev.to draft + Hashnode draft (reviewable on-platform)
//   node scripts/export.mjs lessons/<dir> --publish     # go live (explicit)
//   ...add --only devto,hashnode,linkedin,medium to limit channels
//
// LinkedIn + Medium always produce paste-ready files in <dir>/out/. If a Buffer token
// is set, LinkedIn is also queued to Buffer. Results are written back into meta.yaml.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, basename } from "node:path";
import { get, has } from "./lib/config.mjs";
import { parseFrontmatter } from "./lib/frontmatter.mjs";

const argv = process.argv.slice(2);
const lessonDir = argv.find((a) => !a.startsWith("--"));
const flag = (n) => argv.includes(`--${n}`);
const opt = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : ""; };
if (!lessonDir) { console.error("usage: node scripts/export.mjs lessons/<dir> [--draft|--publish] [--only a,b]"); process.exit(1); }

const mode = flag("publish") ? "publish" : flag("draft") ? "draft" : "dry-run";
const only = opt("only") ? opt("only").split(",").map((s) => s.trim()) : ["devto", "hashnode", "linkedin", "medium"];
const want = (c) => only.includes(c);

// --- read the lesson ---
const read = (f) => (existsSync(resolve(lessonDir, f)) ? readFileSync(resolve(lessonDir, f), "utf8") : "");
const lesson = parseFrontmatter(read("lesson.md"));
const article = parseFrontmatter(read("article.md"));
const linkedin = read("linkedin.md").replace(/^<!--[\s\S]*?-->\s*/g, "").trim();
const title = lesson.fm.title || article.fm.title || basename(lessonDir);
const tags = (Array.isArray(lesson.fm.tags) ? lesson.fm.tags : []).map((t) => t.replace(/[^a-z0-9]/gi, "").toLowerCase()).filter(Boolean).slice(0, 4);
const articleBody = article.body || lesson.body;
const canonical = has("GITHUB_ASSET_BASE_URL") ? "" : ""; // canonical set once repo URL known; left blank otherwise
const cover = has("GITHUB_ASSET_BASE_URL") ? `${get("GITHUB_ASSET_BASE_URL").replace(/\/$/, "")}/${lessonDir.replace(/^\.?\//, "")}/assets/card.png` : "";

const outDir = resolve(lessonDir, "out");
mkdirSync(outDir, { recursive: true });
const results = {};
const log = (c, msg) => console.log(`  [${c}] ${msg}`);

async function post(url, opts) {
  const r = await fetch(url, opts);
  const body = await r.text(); let json; try { json = JSON.parse(body); } catch {}
  return { status: r.status, json, body };
}

console.log(`\n  export "${title}"  ·  mode: ${mode}  ·  channels: ${only.join(", ")}\n`);

// --- dev.to ---
if (want("devto")) {
  if (mode === "dry-run") { log("devto", `would ${has("DEVTO_API_KEY") ? "create draft" : "SKIP (no token)"} · ${tags.join(",")}`); }
  else if (!has("DEVTO_API_KEY")) { log("devto", "skip — no DEVTO_API_KEY"); }
  else {
    const payload = { article: { title, body_markdown: articleBody, published: mode === "publish", tags: tags.join(","), series: lesson.fm.series || null, main_image: cover || null } };
    try {
      const r = await post("https://dev.to/api/articles", { method: "POST", headers: { "api-key": get("DEVTO_API_KEY"), "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (r.status === 201) { results.devto = { status: mode === "publish" ? "published" : "draft", url: r.json?.url || "" }; log("devto", `${results.devto.status}: ${results.devto.url}`); }
      else { log("devto", `FAILED HTTP ${r.status}: ${r.body.slice(0, 160)}`); }
    } catch (e) { log("devto", `error: ${e.message}`); }
  }
}

// --- Hashnode --- (publishPost; needs Pro since 2026-05-13)
if (want("hashnode")) {
  const ready = has("HASHNODE_TOKEN") && has("HASHNODE_PUBLICATION_ID");
  if (mode === "dry-run") { log("hashnode", `would ${ready ? "publish" : "SKIP (token/publication id missing)"}`); }
  else if (mode === "draft") { log("hashnode", "skip — Hashnode API publishes immediately; use --publish when ready"); }
  else if (!ready) { log("hashnode", "skip — set HASHNODE_TOKEN + HASHNODE_PUBLICATION_ID (check-setup prints ids)"); }
  else {
    const mutation = `mutation Publish($input: PublishPostInput!) { publishPost(input: $input) { post { url slug } } }`;
    const input = { title, contentMarkdown: articleBody, publicationId: get("HASHNODE_PUBLICATION_ID"), tags: tags.map((t) => ({ slug: t, name: t })), ...(cover ? { coverImageOptions: { coverImageURL: cover } } : {}) };
    try {
      const r = await post("https://gql.hashnode.com", { method: "POST", headers: { "Content-Type": "application/json", Authorization: get("HASHNODE_TOKEN") }, body: JSON.stringify({ query: mutation, variables: { input } }) });
      const url = r.json?.data?.publishPost?.post?.url;
      if (url) { results.hashnode = { status: "published", url }; log("hashnode", `published: ${url}`); }
      else { log("hashnode", `FAILED: ${r.json?.errors?.[0]?.message || "HTTP " + r.status + " " + r.body.slice(0, 140)}`); }
    } catch (e) { log("hashnode", `error: ${e.message}`); }
  }
}

// --- LinkedIn --- (paste file always; Buffer queue if configured)
if (want("linkedin")) {
  writeFileSync(resolve(outDir, "linkedin.txt"), linkedin + "\n");
  log("linkedin", `paste-ready → ${lessonDir}/out/linkedin.txt`);
  if (mode !== "dry-run" && has("BUFFER_ACCESS_TOKEN") && has("BUFFER_LINKEDIN_PROFILE_ID")) {
    try {
      const params = new URLSearchParams({ "profile_ids[]": get("BUFFER_LINKEDIN_PROFILE_ID"), text: linkedin, access_token: get("BUFFER_ACCESS_TOKEN") });
      if (mode === "publish") params.set("now", "true");
      const r = await post("https://api.bufferapp.com/1/updates/create.json", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString() });
      if (r.json?.success) { results.linkedin = { status: mode === "publish" ? "published" : "queued" }; log("linkedin", `Buffer: ${results.linkedin.status}`); }
      else { log("linkedin", `Buffer failed: ${r.body.slice(0, 140)}`); }
    } catch (e) { log("linkedin", `Buffer error: ${e.message}`); }
  }
}

// --- Medium --- (paste file only)
if (want("medium")) {
  writeFileSync(resolve(outDir, "medium.md"), `# ${title}\n\n${articleBody}\n`);
  log("medium", `paste-ready → ${lessonDir}/out/medium.md (import at medium.com/p/import)`);
}

// --- write results back into meta.yaml (best-effort, human-readable append) ---
if (Object.keys(results).length) {
  const stamp = `\n# --- export ${mode} (fill dates manually) ---\n` + Object.entries(results).map(([c, r]) => `#   ${c}: ${r.status}${r.url ? " " + r.url : ""}`).join("\n") + "\n";
  const metaPath = resolve(lessonDir, "meta.yaml");
  if (existsSync(metaPath)) writeFileSync(metaPath, readFileSync(metaPath, "utf8") + stamp);
  console.log(`\n  logged results to meta.yaml`);
}
console.log(mode === "dry-run" ? "\n  dry-run only — no network publish. Re-run with --draft or --publish.\n" : "\n  done.\n");
