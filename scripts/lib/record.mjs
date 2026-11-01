// Shared editors for the two records a published post leaves behind:
// the channel block in meta.yaml and the url_* keys in lesson.md front matter.
// Pure string in, string out, so callers decide when to write and --dry-run is free.
//
// meta.yaml channels come in two shapes in this repo, and both are handled:
//   inline:  `  devto:     { status: pending, url: "", published: "", reactions: 0 }`
//   block:   `  devto:` then indented `status:` / `url:` / `published:` lines
export const LI_URL = /^https:\/\/www\.linkedin\.com\/\S+$/;

/** Read one channel's {status,url,published} from meta.yaml text. */
export function readChannel(meta, channel) {
  const inline = new RegExp(`^(\\s*)${channel}:\\s*\\{([^}]*)\\}`, "m").exec(meta);
  const grab = (src, k) => ((new RegExp(`${k}:\\s*"?([^",}\\n]*)"?`).exec(src) || [])[1] || "").trim();
  if (inline) return { status: grab(inline[2], "status"), url: grab(inline[2], "url"), published: grab(inline[2], "published") };
  const block = new RegExp(`^(\\s*)${channel}:[ \\t]*\\n((?:\\1[ \\t]+.*(?:\\n|$))+)`, "m").exec(meta);
  if (block) return { status: grab(block[2], "status"), url: grab(block[2], "url"), published: grab(block[2], "published") };
  return { status: "", url: "", published: "" };
}

/** Set status/url/published on one channel, keeping every other key (counters etc). */
export function setChannel(meta, channel, { status, url, published }) {
  const vals = { status, url, published };
  const inline = new RegExp(`^(\\s*${channel}:\\s*\\{)([^}]*)(\\})`, "m");
  if (inline.test(meta)) {
    return meta.replace(inline, (_m, open, body, close) => {
      let b = body;
      for (const [k, v] of Object.entries(vals)) {
        if (v === undefined || v === "") continue;
        const val = k === "status" ? v : `"${v}"`;
        const re = new RegExp(`${k}:\\s*(?:"[^"]*"|[^,}]*)`);
        b = re.test(b) ? b.replace(re, `${k}: ${val}`) : b.replace(/\s*$/, `, ${k}: ${val} `);
      }
      return open + b + close;
    });
  }
  const block = new RegExp(`^([ \\t]*)${channel}:[ \\t]*\\n((?:\\1[ \\t]+.*(?:\\n|$))+)`, "m");
  return meta.replace(block, (_m, ind, body) => {
    let b = body;
    const pad = (/^([ \t]+)\S/.exec(b) || [, ind + "  "])[1];
    for (const [k, v] of Object.entries(vals)) {
      if (v === undefined || v === "") continue;
      const re = new RegExp(`^(${pad})${k}:.*$`, "m");
      b = re.test(b) ? b.replace(re, `$1${k}: ${v}`) : b.replace(/\n?$/, `\n${pad}${k}: ${v}\n`);
    }
    return `${ind}${channel}:\n${b}`;
  });
}

/** Set a key in lesson.md front matter (replace the line or append inside the block). */
export function setFrontKey(md, key, value) {
  const m = /^---\n([\s\S]*?)\n---/.exec(md);
  if (!m) return md;
  const re = new RegExp(`^${key}:.*$`, "m");
  const fm = re.test(m[1]) ? m[1].replace(re, `${key}: ${value}`) : `${m[1]}\n${key}: ${value}`;
  return md.slice(0, m.index) + `---\n${fm}\n---` + md.slice(m.index + m[0].length);
}
