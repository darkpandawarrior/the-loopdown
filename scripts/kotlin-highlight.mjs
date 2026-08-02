// Tiny Kotlin syntax highlighter that emits absolutely-positioned SVG <text>
// runs. Small on purpose: enough colour to read as code, not a full grammar.
// Shared by carousel.mjs (slides) and render.mjs (the code card).
export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const KW = /\b(fun|val|var|try|catch|finally|throw|return|if|else|when|suspend|class|object|interface|private|internal|override|import|package|is|as|in|for|while|null|true|false|this)\b/;
const TOKENS = [
  ["comment", /^\/\/.*$/],
  ["string", /^"(?:[^"\\]|\\.)*"/],
  ["kw", new RegExp("^" + KW.source)],
  ["num", /^\b\d+(?:\.\d+)?\b/],
  ["fn", /^\b[a-z][A-Za-z0-9_]*(?=\()/],
  ["type", /^\b[A-Z][A-Za-z0-9_]*\b/],
  ["punct", /^[{}()\[\].,:;=<>+\-*/!?&|]+/],
  ["ws", /^\s+/],
  ["word", /^[^\s{}()\[\].,:;=<>+\-*/!?&|"]+/],
];
export const CODE_COLOR = {
  comment: "#5A6675", string: "#7EE787", kw: "#FF7B9C", num: "#F0A868",
  fn: "#8AB4F8", type: "#C6A6FF", punct: "#8B98A8", ws: null, word: "#C9D4E0",
};

// Returns HTML spans for one line of code. Used by the Chromium renderer, which
// unlike the SVG path gets real text layout and does not need a monospace grid.
export function highlightHtml(line) {
  let rest = line, out = "";
  while (rest.length) {
    let matched = false;
    for (const [kind, re] of TOKENS) {
      const m = rest.match(re);
      if (!m || !m[0].length) continue;
      const text = m[0];
      out += kind === "ws" ? esc(text) : `<span class="t-${kind}">${esc(text)}</span>`;
      rest = rest.slice(text.length); matched = true; break;
    }
    if (!matched) { out += esc(rest[0]); rest = rest.slice(1); }
  }
  return out || "&nbsp;";
}

// Returns SVG markup for one line of code laid out on a monospace grid.
export function highlight(line, x, y, size, fontFamily) {
  let rest = line, out = "", col = 0;
  const adv = size * 0.6; // monospace advance width
  while (rest.length) {
    let matched = false;
    for (const [kind, re] of TOKENS) {
      const m = rest.match(re);
      if (!m || !m[0].length) continue;
      const text = m[0];
      if (kind !== "ws") {
        out += `<text x="${(x + col * adv).toFixed(1)}" y="${y}" fill="${CODE_COLOR[kind]}" font-family="${fontFamily}" font-size="${size}" xml:space="preserve">${esc(text)}</text>`;
      }
      col += text.length; rest = rest.slice(text.length); matched = true; break;
    }
    if (!matched) { col += 1; rest = rest.slice(1); }
  }
  return out;
}
