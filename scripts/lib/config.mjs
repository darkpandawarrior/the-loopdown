// Loads secrets from repo-root .env (gitignored). No dependency — tiny parser.
// Never logs values. Returns { present: {...bool}, get(key) }.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ENV_PATH = join(ROOT, ".env");

const env = { ...process.env };
if (existsSync(ENV_PATH)) {
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in process.env)) env[k] = v; // real env wins over file
  }
}

export const KEYS = [
  "DEVTO_API_KEY",
  "HASHNODE_TOKEN",
  "HASHNODE_PUBLICATION_ID",
  "MEDIUM_TOKEN",
  "MEDIUM_USER_ID",
  "BUFFER_ACCESS_TOKEN",
  "BUFFER_LINKEDIN_PROFILE_ID",
  "GITHUB_ASSET_BASE_URL", // where card.png is reachable for cover images (e.g. raw.githubusercontent…)
  "CANONICAL_BASE_URL",    // override profile.yaml canonical_strategy; e.g. https://yoursite/the-loopdown
];

export const get = (k) => env[k] || "";
export const has = (k) => Boolean(env[k] && env[k].trim());
export const present = Object.fromEntries(KEYS.map((k) => [k, has(k)]));
export { ROOT, ENV_PATH };
