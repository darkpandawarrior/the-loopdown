// Loads profile.yaml (flat key: value) and builds the consistent cross-platform
// footer + cross-links that make every post feel like one connected campaign.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const P = join(ROOT, "profile.yaml");

export function loadProfile() {
  const out = {};
  if (existsSync(P)) {
    for (const line of readFileSync(P, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const kv = t.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
      if (kv) out[kv[1]] = kv[2].replace(/\s+#.*$/, "").trim();
    }
  }
  return out;
}

const LABEL = { site: "Site", github: "GitHub", linkedin: "LinkedIn", devto: "dev.to", hashnode: "Hashnode", medium: "Medium" };

// Human title-case a series/cast id: "sensors-who-lie" -> "Sensors Who Lie"
export const titleize = (id) => String(id || "").split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");

// The branded footer appended to every long-form article. `ctx` carries the
// resolved canonical URL and the previous-in-series episode (if any).
export function buildFooter(profile, fm, ctx = {}) {
  const brand = profile.brand || "The Loopdown";
  const lines = ["", "---", ""];

  const iter = fm.loop_iteration ? `Iteration ${fm.loop_iteration} of ` : "";
  lines.push(`*🌀 ${iter}**${brand}** — ${profile.tagline || "field notes from an engineer who writes"}.*`);

  const meta = [];
  if (fm.series) meta.push(`Series: **${titleize(fm.series)}**`);
  const cast = Array.isArray(fm.cast) ? fm.cast : fm.cast ? [fm.cast] : [];
  if (cast.length) meta.push(`Featuring: ${cast.map(titleize).join(", ")}`);
  if (meta.length) lines.push(`*${meta.join(" · ")}*`);

  if (ctx.prev) lines.push(`*← Previously in this series: [${ctx.prev.title}](${ctx.prev.url})*`);
  if (ctx.seriesIndexUrl) lines.push(`*📚 The full series: [${titleize(fm.series)}](${ctx.seriesIndexUrl})*`);

  const follow = (profile.follow_order || "linkedin, devto, github")
    .split(",").map((s) => s.trim())
    .map((k) => (profile[`url_${k}`] ? `[${LABEL[k] || k}](${profile[`url_${k}`]})` : null))
    .filter(Boolean);
  if (follow.length) { lines.push(""); lines.push(`*Follow the loop → ${follow.join(" · ")}*`); }

  if (ctx.canonicalUrl) lines.push(`*Originally published in [${brand}](${ctx.canonicalUrl}).*`);
  return lines.join("\n");
}

// The single line appended to a LinkedIn post to drive traffic to the long-form.
export function linkedinCrossLink(url) {
  return url ? `\n\n📖 Full write-up → ${url}` : "";
}
