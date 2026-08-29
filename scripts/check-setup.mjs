#!/usr/bin/env node
// Readiness dashboard. Shows which credentials are set and validates each against a
// READ-only endpoint (never publishes). For Hashnode it also prints your publication
// ids so you can paste HASHNODE_PUBLICATION_ID. Run any time:
//
//   node scripts/check-setup.mjs
import { get, has } from "./lib/config.mjs";

const ok = (s) => `\x1b[32m${s}\x1b[0m`;
const bad = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const line = (label, state, note = "") => console.log(`  ${state}  ${label.padEnd(22)} ${dim(note)}`);

async function fetchJson(url, opts, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    const body = await r.text();
    let json; try { json = JSON.parse(body); } catch { json = null; }
    return { status: r.status, json, body };
  } finally { clearTimeout(t); }
}

console.log("\n  The Loopdown — pipeline readiness\n  " + "─".repeat(44));

// dev.to
if (!has("DEVTO_API_KEY")) {
  line("dev.to", bad("○"), "no DEVTO_API_KEY — see SETUP.md");
} else {
  try {
    const r = await fetchJson("https://dev.to/api/users/me", { headers: { "api-key": get("DEVTO_API_KEY") } });
    if (r.status === 200) line("dev.to", ok("●"), `authed as @${r.json?.username || "?"} — publish ready`);
    else line("dev.to", bad("✕"), `token rejected (HTTP ${r.status})`);
  } catch (e) { line("dev.to", bad("✕"), `error: ${e.message}`); }
}

// Hashnode
if (!has("HASHNODE_TOKEN")) {
  line("Hashnode", dim("○"), "FREE path = import from dev.to URL (API publish needs Pro)");
} else {
  try {
    const q = `{ me { username publications(first: 10) { edges { node { id title } } } } }`;
    const r = await fetchJson("https://gql.hashnode.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: get("HASHNODE_TOKEN") },
      body: JSON.stringify({ query: q }),
    });
    const me = r.json?.data?.me;
    if (me) {
      line("Hashnode", ok("●"), `authed as @${me.username}`);
      const pubs = me.publications?.edges || [];
      if (pubs.length) {
        console.log(dim("       publications (set HASHNODE_PUBLICATION_ID to one):"));
        for (const { node } of pubs) console.log(dim(`         ${node.id}  ${node.title}`));
        if (has("HASHNODE_PUBLICATION_ID")) line("  → publication", ok("●"), get("HASHNODE_PUBLICATION_ID"));
        else line("  → publication", bad("○"), "HASHNODE_PUBLICATION_ID not set (pick one above)");
      } else {
        console.log(dim("       no publications found — create one on Hashnode first."));
      }
    } else if (!r.json) {
      // Hashnode RETIRED free API access on 2026-05-13: "Every API request,
      // queries and mutations, now requires a Pro plan on your publication."
      // Without Pro, gql.hashnode.com answers a POST with a 301 to that
      // announcement page rather than a GraphQL error — so the response is
      // HTML, `data.me` is absent, and any check parsing for it lands in
      // whichever branch it happens to fall into.
      //
      // Both plausible readings are wrong on their own. "Token rejected" sends
      // the reader to re-issue working credentials; "the API moved or is down"
      // (this branch's first wording) implies an outage that will pass. It is
      // neither: it is a deliberate paywall, and the only fix is a Pro plan or
      // the free import path.
      line("Hashnode", bad("✕"), `free API access was retired 2026-05-13 — publishing needs Pro on the publication (HTTP ${r.status}, redirected to the announcement)`);
      console.log(dim("       free path: publish to dev.to, then import that URL from the Hashnode editor."));
    } else {
      line("Hashnode", bad("✕"), `token rejected or no Pro (${r.json?.errors?.[0]?.message || "HTTP " + r.status})`);
    }
  } catch (e) { line("Hashnode", bad("✕"), `error: ${e.message}`); }
}

// Buffer (optional)
if (!has("BUFFER_ACCESS_TOKEN")) {
  line("Buffer (LinkedIn)", dim("○"), "optional — LinkedIn uses paste-export until set");
} else {
  try {
    const r = await fetchJson(`https://api.bufferapp.com/1/user.json?access_token=${encodeURIComponent(get("BUFFER_ACCESS_TOKEN"))}`, {});
    if (r.status === 200) line("Buffer (LinkedIn)", ok("●"), `authed${has("BUFFER_LINKEDIN_PROFILE_ID") ? "" : " — set BUFFER_LINKEDIN_PROFILE_ID"}`);
    else line("Buffer (LinkedIn)", bad("✕"), `token rejected (HTTP ${r.status})`);
  } catch (e) { line("Buffer (LinkedIn)", bad("✕"), `error: ${e.message}`); }
}

// Medium (legacy API — token may not be mintable on newer accounts)
if (!has("MEDIUM_TOKEN")) {
  line("Medium", dim("○"), "no MEDIUM_TOKEN — paste/import fallback (see SETUP.md)");
} else {
  try {
    const r = await fetchJson("https://api.medium.com/v1/me", { headers: { Authorization: `Bearer ${get("MEDIUM_TOKEN")}`, Accept: "application/json" } });
    if (r.status === 200 && r.json?.data?.id) {
      line("Medium", ok("●"), `authed as @${r.json.data.username || "?"} — publish ready`);
      if (!has("MEDIUM_USER_ID")) console.log(dim(`       set MEDIUM_USER_ID=${r.json.data.id}`));
    } else line("Medium", bad("✕"), `token rejected (HTTP ${r.status})`);
  } catch (e) { line("Medium", bad("✕"), `error: ${e.message}`); }
}
line("Cover URL", has("GITHUB_ASSET_BASE_URL") ? ok("●") : dim("○"), has("GITHUB_ASSET_BASE_URL") ? get("GITHUB_ASSET_BASE_URL") : "GITHUB_ASSET_BASE_URL unset (covers skipped)");

console.log("  " + "─".repeat(44));
console.log(dim("  ● ready   ✕ set but failing   ○ not set   — manual\n"));
console.log(dim("  Next: fill .env (copy from .env.example), re-run this, then:"));
console.log(dim("        node scripts/export.mjs lessons/<dir> --dry-run\n"));
