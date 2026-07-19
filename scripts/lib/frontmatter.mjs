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
    let v = cleanValue(kv[2]);
    if (v.startsWith("[") && v.endsWith("]")) {
      v = v.slice(1, -1).split(",").map((s) => cleanValue(s)).filter(Boolean);
    }
    fm[kv[1]] = v;
  }
  return { fm, body: m[2].trim() };
}
