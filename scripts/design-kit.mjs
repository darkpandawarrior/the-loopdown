// The Loopdown — visual identity.
//
// Two things live here:
//   1. TEXTURE/CHROME primitives (grain, halftone, vignette, glass, plate framing)
//   2. CAST portraits — the recurring characters from lore/cast.md, drawn.
//
// The bible calls the tone "a naturalist's field journal, if the wildlife were
// race conditions". So the cast is drawn as specimen plates: line-art figures on
// a dark ground, corner ticks, a label with the character's real class name.
// Consistency is the point. A reader should recognise The Messenger on sight the
// third time they scroll past one of these.
export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const T = {
  bg0: "#06080B", bg1: "#0D1219", bg2: "#141B25",
  ink: "#F2F6FA", inkDim: "#A6B6C8", inkFaint: "#5C6878",
  panel: "#04060A", line: "#1E2733",
  paper: "#E8DEC8", danger: "#FF6B81", good: "#7EE787",
  sans: "'SF Pro Display','Helvetica Neue','Inter',sans-serif",
  mono: "'SF Mono','JetBrains Mono',Menlo,monospace",
};

// ── shared <defs>. Called once per slide. ────────────────────────────────────
export function defs(accent) {
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.55" y2="1">
      <stop offset="0" stop-color="${T.bg2}"/><stop offset="0.55" stop-color="${T.bg1}"/><stop offset="1" stop-color="${T.bg0}"/>
    </linearGradient>
    <radialGradient id="spot" cx="0.16" cy="0.04" r="0.85">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.26"/>
      <stop offset="0.5" stop-color="${accent}" stop-opacity="0.06"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vig" cx="0.5" cy="0.45" r="0.78">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
    <linearGradient id="rail" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${accent}"/>
      <stop offset="0.45" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0.08"/>
    </linearGradient>
    <linearGradient id="cloak" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#1A2430"/><stop offset="1" stop-color="#080C12"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.055"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0.012"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0.55" stop-color="${accent}" stop-opacity="0"/>
      <stop offset="0.86" stop-color="${accent}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M44 0 L0 0 0 44" fill="none" stroke="${T.inkFaint}" stroke-opacity="0.10" stroke-width="1"/>
    </pattern>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <filter id="soft" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
    <filter id="glowsm" x="-70%" y="-70%" width="240%" height="240%">
      <feGaussianBlur stdDeviation="7"/>
    </filter>
  </defs>`;
}

// Background stack: gradient, grid, spotlight, vignette, film grain.
export function ground(W, H) {
  return `
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#spot)"/>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.055"/>`;
}

// A frosted panel. Used for code blocks, callouts, fix cards.
export function glassPanel(x, y, w, h, { r = 20, stroke = T.line, strokeOpacity = 1 } = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${T.panel}" fill-opacity="0.82"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#glass)"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${stroke}" stroke-opacity="${strokeOpacity}" stroke-width="1.5"/>`;
}

// Specimen-plate corner ticks. The field-journal signature.
export function plateTicks(x, y, w, h, accent, len = 26) {
  const c = (px, py, dx, dy) =>
    `<path d="M${px + dx * len} ${py} H${px} V${py + dy * len}" fill="none" stroke="${accent}" stroke-opacity="0.65" stroke-width="2.5"/>`;
  return c(x, y, 1, 1) + c(x + w, y, -1, 1) + c(x, y + h, 1, -1) + c(x + w, y + h, -1, -1);
}

// ═══════════════════════════════════════════════════════════════════════════
// CAST
// Each portrait draws inside its own 480x520 box and is placed with a transform.
// ═══════════════════════════════════════════════════════════════════════════

// The Messenger — CancellationException. An assassin's cloak, and a folded note.
// The whole joke of the character is the silhouette says "killer" and the hands
// say "courier", so the cloak reads sinister and the note reads gentle.
function messenger(accent) {
  return `
  <g>
    <circle cx="190" cy="205" r="165" fill="url(#halo)"/>
    <circle cx="190" cy="205" r="152" fill="none" stroke="${accent}" stroke-opacity="0.30" stroke-width="1.5" stroke-dasharray="3 11"/>

    <!-- cloak + hood, one silhouette -->
    <path d="M46 502 C 60 400, 84 336, 104 300
             C 112 250, 118 200, 128 172
             C 142 132, 164 116, 190 116
             C 216 116, 238 132, 252 172
             C 262 200, 268 250, 276 300
             C 296 336, 320 400, 334 502 Z"
          fill="url(#cloak)" stroke="${accent}" stroke-opacity="0.85" stroke-width="3" stroke-linejoin="round"/>

    <!-- hood opening -->
    <path d="M190 132 C 222 132, 244 162, 244 200
             C 244 240, 220 264, 190 264
             C 160 264, 136 240, 136 200
             C 136 162, 158 132, 190 132 Z"
          fill="#020407" stroke="${accent}" stroke-opacity="0.55" stroke-width="2"/>

    <!-- eyes: a courier, not a killer. Soft, level, tired. -->
    <g filter="url(#glowsm)" opacity="0.9">
      <ellipse cx="171" cy="203" rx="11" ry="5" fill="${accent}"/>
      <ellipse cx="209" cy="203" rx="11" ry="5" fill="${accent}"/>
    </g>
    <ellipse cx="171" cy="203" rx="9" ry="3.6" fill="${T.ink}" fill-opacity="0.92"/>
    <ellipse cx="209" cy="203" rx="9" ry="3.6" fill="${T.ink}" fill-opacity="0.92"/>

    <!-- cloak folds -->
    <path d="M156 300 C 150 366, 146 434, 142 496" fill="none" stroke="${accent}" stroke-opacity="0.22" stroke-width="2"/>
    <path d="M190 306 C 190 372, 190 440, 190 498" fill="none" stroke="${accent}" stroke-opacity="0.28" stroke-width="2"/>
    <path d="M224 300 C 230 366, 236 434, 240 496" fill="none" stroke="${accent}" stroke-opacity="0.22" stroke-width="2"/>

    <!-- extended arm: sleeve, cuff, then the note, then the hand ON TOP so it
         reads as gripping rather than floating behind -->
    <path d="M250 288 C 284 292, 310 296, 330 292
             C 336 306, 335 322, 328 334
             C 304 338, 274 332, 250 326 Z"
          fill="url(#cloak)" stroke="${accent}" stroke-opacity="0.8" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M326 291 C 334 302, 334 324, 326 335" fill="none" stroke="${accent}" stroke-opacity="0.7" stroke-width="2.5"/>

    <g transform="translate(346 254) rotate(-7)">
      <rect x="0" y="0" width="112" height="84" rx="5" fill="${T.paper}"/>
      <rect x="0" y="0" width="112" height="84" rx="5" fill="none" stroke="#B9AC90" stroke-width="1.5"/>
      <path d="M0 26 H112" stroke="#C4B79A" stroke-width="1"/>
      <text x="14" y="19" fill="#6B6252" font-family="${T.mono}" font-size="11" letter-spacing="1">NOTICE</text>
      <path d="M14 44 H82 M14 58 H92 M14 72 H62" stroke="#8E856F" stroke-width="3" stroke-linecap="round"/>
      <circle cx="96" cy="68" r="10" fill="${accent}" fill-opacity="0.85"/>
      <circle cx="96" cy="68" r="10" fill="none" stroke="#8E856F" stroke-width="1"/>
    </g>

    <!-- hand, thumb over the front of the note -->
    <path d="M330 296 C 344 292, 356 298, 358 310
             C 360 324, 350 334, 336 334
             C 328 334, 324 326, 324 314 Z"
          fill="#0E1620" stroke="${accent}" stroke-opacity="0.85" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M340 302 C 350 302, 354 308, 352 316" fill="none" stroke="${accent}" stroke-opacity="0.45" stroke-width="2"/>
  </g>`;
}

// The Concussed Witness — GPS. Confident, cooperative, concussed. A satellite
// with a bandaged dish, reporting a position that is nowhere near the pin.
function concussedWitness(accent) {
  return `
  <g>
    <circle cx="190" cy="205" r="165" fill="url(#halo)"/>
    <circle cx="190" cy="205" r="152" fill="none" stroke="${accent}" stroke-opacity="0.30" stroke-width="1.5" stroke-dasharray="3 11"/>

    <!-- solar wings -->
    <g stroke="${accent}" stroke-opacity="0.75" stroke-width="2.5" fill="url(#cloak)">
      <rect x="24" y="168" width="104" height="70" rx="4"/>
      <rect x="252" y="168" width="104" height="70" rx="4"/>
    </g>
    <g stroke="${accent}" stroke-opacity="0.30" stroke-width="1.5">
      <path d="M58 168 V238 M92 168 V238 M286 168 V238 M320 168 V238"/>
    </g>

    <!-- body -->
    <rect x="140" y="150" width="100" height="106" rx="10" fill="url(#cloak)" stroke="${accent}" stroke-opacity="0.85" stroke-width="3"/>
    <path d="M128 203 H140 M240 203 H252" stroke="${accent}" stroke-opacity="0.75" stroke-width="3"/>

    <!-- dish, tilted wrong -->
    <g transform="translate(190 138) rotate(-18)">
      <ellipse cx="0" cy="0" rx="52" ry="20" fill="#020407" stroke="${accent}" stroke-opacity="0.8" stroke-width="2.5"/>
      <path d="M0 0 V-34" stroke="${accent}" stroke-opacity="0.8" stroke-width="2.5"/>
      <circle cx="0" cy="-38" r="6" fill="${accent}" fill-opacity="0.9"/>
    </g>

    <!-- bandage -->
    <path d="M146 176 L236 158" stroke="${T.paper}" stroke-opacity="0.9" stroke-width="13" stroke-linecap="round"/>
    <path d="M146 176 L236 158" stroke="#B9AC90" stroke-opacity="0.5" stroke-width="1"/>

    <!-- dizzy eyes -->
    <g stroke="${T.ink}" stroke-opacity="0.9" stroke-width="3" fill="none" stroke-linecap="round">
      <path d="M162 210 l14 14 M176 210 l-14 14"/>
      <path d="M204 210 l14 14 M218 210 l-14 14"/>
    </g>

    <!-- broadcast, confidently, to the wrong place -->
    <g stroke="${accent}" stroke-opacity="0.5" stroke-width="2.5" fill="none" stroke-dasharray="7 9">
      <path d="M190 262 C 210 320, 250 360, 306 386"/>
    </g>
    <g transform="translate(306 386)">
      <circle r="13" fill="none" stroke="${T.danger}" stroke-width="3"/>
      <path d="M-8 -8 L8 8 M8 -8 L-8 8" stroke="${T.danger}" stroke-width="3"/>
    </g>
    <text x="330" y="392" fill="${T.danger}" font-family="${T.mono}" font-size="19">400 km/h</text>
  </g>`;
}

const CAST = {
  "the-messenger": {
    draw: messenger,
    name: "THE MESSENGER",
    className: "CancellationException",
    line: "It only ever delivers a note.",
  },
  "the-concussed-witness": {
    draw: concussedWitness,
    name: "THE CONCUSSED WITNESS",
    className: "LocationManager",
    line: "Confident. Cooperative. Often wrong.",
  },
};

// Full specimen plate: framed portrait + label block.
// x,y is the plate's top-left; the portrait box is 480x520 scaled by `scale`.
export function specimenPlate(id, accent, { x, y, scale = 1, exhibit = "01" } = {}) {
  const c = CAST[id];
  if (!c) throw new Error(`unknown cast member "${id}" — add it to CAST in scripts/design-kit.mjs`);
  const w = 480 * scale, h = 520 * scale;
  const padX = 34, padY = 26;
  const plateW = w + padX * 2, plateH = h + padY * 2 + 96;
  return `
  ${plateTicks(x, y, plateW, plateH, accent, 30)}
  <g transform="translate(${x + padX} ${y + padY}) scale(${scale})">${c.draw(accent)}</g>
  <path d="M${x + 40} ${y + padY + h + 22} H${x + plateW - 40}" stroke="${accent}" stroke-opacity="0.35" stroke-width="1.5"/>
  <text x="${x + 40}" y="${y + padY + h + 66}" fill="${T.ink}" font-family="${T.sans}" font-size="34" font-weight="800" letter-spacing="2">${esc(c.name)}</text>
  <text x="${x + plateW - 40}" y="${y + padY + h + 66}" fill="${accent}" font-family="${T.mono}" font-size="24" text-anchor="end">exhibit ${esc(exhibit)}</text>
  <text x="${x + 40}" y="${y + padY + h + 100}" fill="${T.inkFaint}" font-family="${T.mono}" font-size="23">${esc(c.className)}</text>`;
}

export const castLine = (id) => CAST[id]?.line ?? "";

// Portrait alone, no plate. For cover watermarks.
export function portrait(id, accent) {
  const c = CAST[id];
  if (!c) throw new Error(`unknown cast member "${id}"`);
  return `<svg viewBox="0 0 480 520" xmlns="http://www.w3.org/2000/svg">${defs(accent)}${c.draw(accent)}</svg>`;
}

// Plate as a standalone SVG, for the HTML renderer (which supplies its own label).
export function portraitPlate(id, accent) {
  return portrait(id, accent);
}
export const castMeta = (id) => {
  const c = CAST[id];
  if (!c) throw new Error(`unknown cast member "${id}"`);
  return { name: c.name, className: c.className, line: c.line };
};

// ═══════════════════════════════════════════════════════════════════════════
// FIGURES — self-contained diagram SVGs, sized by their own viewBox.
// ═══════════════════════════════════════════════════════════════════════════

// The suspend stack with a cancellation signal travelling up it. `blocked`
// swaps between the bug (signal dies at the broad catch) and the fix.
function messengerStack(accent, blocked) {
  const rows = blocked
    ? [
        { label: "your coroutine", note: "never hears it", ghost: true },
        { label: "catch (e: Exception)", note: "swallows it", bad: true },
        { label: "try { ... }", note: "" },
        { label: "api.search(query)", note: "suspend call" },
      ]
    : [
        { label: "coroutine unwinds", note: "clean shutdown", ok: true },
        { label: "catch (e: IOException)", note: "your real error" },
        { label: "catch (e: CancellationException)", note: "throw e", ok: true },
        { label: "api.search(query)", note: "" },
      ];
  const signal = blocked ? accent : T.good;
  let out = "";

  // rail
  out += `<line x1="60" y1="500" x2="60" y2="${blocked ? 194 : 40}" stroke="${signal}" stroke-width="4.5" stroke-dasharray="13 11" opacity="${blocked ? 0.6 : 1}"/>`;
  if (!blocked) out += `<polygon points="60,24 49,52 71,52" fill="${T.good}"/>`;
  out += `<text x="60" y="540" fill="${signal}" font-family="${T.mono}" font-size="25" text-anchor="middle">cancel()</text>`;

  rows.forEach((r, i) => {
    const top = 20 + i * 126, cy = top + 48;
    const stroke = r.bad ? T.danger : r.ok ? T.good : r.ghost ? T.inkFaint : T.line;
    const dash = r.ghost ? ` stroke-dasharray="11 9"` : "";
    const txt = r.bad ? "#FF9AAB" : r.ok ? "#9DECB0" : r.ghost ? T.inkFaint : T.inkDim;
    out += `<rect x="120" y="${top}" width="740" height="96" rx="15" fill="#04060A" fill-opacity="0.85" stroke="${stroke}" stroke-width="2.5"${dash}/>`;
    out += `<text x="156" y="${cy + 11}" fill="${txt}" font-family="${T.mono}" font-size="30">${esc(r.label)}</text>`;
    if (r.note) out += `<text x="828" y="${cy + 10}" fill="${r.bad ? T.danger : r.ok ? T.good : T.inkFaint}" font-family="${T.sans}" font-size="26" text-anchor="end">${esc(r.note)}</text>`;
  });

  if (blocked) {
    // the wall
    out += `<line x1="60" y1="194" x2="112" y2="194" stroke="${T.danger}" stroke-width="4.5"/>`;
    out += `<circle cx="60" cy="194" r="17" fill="#04060A" stroke="${T.danger}" stroke-width="4.5"/>`;
    out += `<path d="M49 183 L71 205 M71 183 L49 205" stroke="${T.danger}" stroke-width="4.5"/>`;
    out += `<line x1="60" y1="172" x2="60" y2="52" stroke="${T.inkFaint}" stroke-width="3" stroke-dasharray="6 13" opacity="0.42"/>`;
  }
  return `<svg viewBox="0 0 920 570" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}

export const FIGURES = {
  "messenger-intercepted": (accent) => messengerStack(accent, true),
  "messenger-through": (accent) => messengerStack(accent, false),
};
