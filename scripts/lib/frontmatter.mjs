// Shared YAML-ish frontmatter parser for the `---` block. Handles: quoted values
// (inner `#` preserved, e.g. "Prophecy #201112003"), unquoted values with a trailing
// `# comment` stripped, and inline `[a, b, c]` arrays.
export function cleanValue(raw) {
  let v = raw.trim();
  if (v.startsWith('"') || v.startsWith("'")) {
    const q = v[0];
    const end = v.indexOf(q, 1);
    return end !== -1 ? v.slice(1, end) : v.slice(1); // quotes removed, inner # kept
  }
  const h = v.search(/\s+#/); // comment only when preceded by whitespace
  if (h !== -1) v = v.slice(0, h);
  return v.trim();
}

export function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: text.trim() };
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    // Quoting has to be checked BEFORE cleaning, because cleanValue strips the
    // quotes: without this, `planet: "[none, aboard ship]"` parses as an array.
    const quoted = /^\s*["']/.test(kv[2]);
    let v = cleanValue(kv[2]);
    if (!quoted && v.startsWith("[") && v.endsWith("]")) {
      v = v.slice(1, -1).split(",").map((s) => cleanValue(s)).filter(Boolean);
    }
    fm[kv[1]] = v;
  }
  return { fm, body: m[2].trim() };
}

// Self-check: node scripts/lib/frontmatter.mjs
if (import.meta.url === `file://${process.argv[1]}`) {
  const assert = (c, m) => { if (!c) { console.error("FAIL:", m); process.exitCode = 1; } };
  const t = (s) => parseFrontmatter(`---\n${s}\n---\nbody\n`).fm;
  assert(Array.isArray(t("tags: [a, b, c]").tags), "unquoted brackets stay an array");
  assert(t("tags: [a, b, c]").tags.length === 3, "array has 3 items");
  // the regression this guards: a quoted string that happens to start with [
  assert(typeof t('planet: "[none, aboard ship]"').planet === "string", "quoted bracket value is a string");
  assert(t('planet: "[none, aboard ship]"').planet === "[none, aboard ship]", "quoted bracket value keeps its text");
  assert(t('title: "Prophecy #201112003"').title === "Prophecy #201112003", "inner # kept inside quotes");
  assert(t("status: draft # later").status === "draft", "trailing comment stripped when unquoted");
  assert(t("words: 1804").words === "1804", "plain scalar");
  if (!process.exitCode) console.log("frontmatter: all checks pass");
}
