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
  // Tape: the register that cannot lie. Borrowed intact from DEADLOCK's
  // audiovisual canon, where recorded evidence is warm amber and monospace and
  // the narrator's own testimony is a cool sans. Numbers, code and logs are tape.
  amber: "#D9A441",
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

// Shared framing so every specimen sits in the same optical space.
const halo = (accent) => `
    <circle cx="190" cy="205" r="165" fill="url(#halo)"/>
    <circle cx="190" cy="205" r="152" fill="none" stroke="${accent}" stroke-opacity="0.30" stroke-width="1.5" stroke-dasharray="3 11"/>`;

// Doze the Jailer — background execution limits. Drawn from the Warden's canonical
// form: a silhouette at the far end of the hall holding a light that never comes
// closer and never goes away. It does not chase. It lets the dark do the closing.
function jailer(accent) {
  return `
  <g>
    ${halo(accent)}
    <!-- corridor in one-point perspective, vanishing on the figure -->
    <path d="M10 500 L150 250 M370 500 L230 250" stroke="${accent}" stroke-opacity="0.30" stroke-width="2"/>
    <path d="M40 500 L158 268 M340 500 L222 268" stroke="${accent}" stroke-opacity="0.16" stroke-width="1.5"/>
    <path d="M150 250 H230" stroke="${accent}" stroke-opacity="0.4" stroke-width="2"/>
    <!-- light pool on the floor, the only warm thing: this is TAPE, it cannot lie -->
    <ellipse cx="190" cy="404" rx="150" ry="46" fill="${T.amber}" fill-opacity="0.10"/>
    <ellipse cx="190" cy="368" rx="96" ry="30" fill="${T.amber}" fill-opacity="0.14"/>
    <path d="M172 292 L120 420 M208 292 L260 420" stroke="${T.amber}" stroke-opacity="0.22" stroke-width="2"/>
    <!-- the warden, small, distant, unbothered -->
    <path d="M170 300 C 170 268, 210 268, 210 300 L214 372 H166 Z" fill="#080C12" stroke="${accent}" stroke-opacity="0.9" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="190" cy="262" r="17" fill="#080C12" stroke="${accent}" stroke-opacity="0.9" stroke-width="2.5"/>
    <!-- the lamp, held out, fixed -->
    <path d="M214 318 H240" stroke="${accent}" stroke-opacity="0.8" stroke-width="2.5"/>
    <circle cx="248" cy="318" r="13" fill="${T.amber}" fill-opacity="0.85"/>
    <circle cx="248" cy="318" r="21" fill="none" stroke="${T.amber}" stroke-opacity="0.35" stroke-width="2"/>
    <text x="190" y="474" fill="${T.amber}" font-family="${T.mono}" font-size="27" text-anchor="middle">00:05</text>
  </g>`;
}

// The Recomposer — unnecessary recomposition. From the Architect: NEVER SEEN. Known
// only by the room rebuilding just outside your field of view. So the portrait is a
// portrait of an absence: a wall caught mid-crossfade, and no hand on the roller.
function recomposer(accent) {
  return `
  <g>
    ${halo(accent)}
    <!-- the room corner -->
    <path d="M60 150 H320 V430 H60 Z" fill="#080C12" stroke="${accent}" stroke-opacity="0.5" stroke-width="2"/>
    <!-- left half: already repainted, flat. right half: the old wall, still legible -->
    <path d="M190 150 V430" stroke="${accent}" stroke-opacity="0.85" stroke-width="3" stroke-dasharray="14 8"/>
    <g stroke="${T.inkFaint}" stroke-opacity="0.30" stroke-width="1.5">
      <path d="M204 190 H300 M204 220 H286 M204 250 H304 M204 280 H272 M204 310 H296 M204 340 H280 M204 370 H300"/>
    </g>
    <!-- graffiti, legible for 0.3 seconds and never again -->
    <text x="204" y="418" fill="${T.amber}" font-family="${T.mono}" font-size="17" opacity="0.55">who repainted this</text>
    <!-- the roller, no hand -->
    <g transform="translate(140 236) rotate(-16)">
      <rect x="-46" y="-15" width="92" height="30" rx="7" fill="#0E1620" stroke="${accent}" stroke-opacity="0.9" stroke-width="2.5"/>
      <path d="M0 15 V54 H30" fill="none" stroke="${accent}" stroke-opacity="0.7" stroke-width="2.5"/>
    </g>
    <!-- fresh paint, still wet -->
    <path d="M78 268 C 110 262, 150 262, 178 268" stroke="${accent}" stroke-opacity="0.45" stroke-width="9" stroke-linecap="round"/>
    <path d="M78 300 C 108 294, 148 294, 178 300" stroke="${accent}" stroke-opacity="0.28" stroke-width="9" stroke-linecap="round"/>
    <text x="190" y="474" fill="${T.inkFaint}" font-family="${T.mono}" font-size="22" text-anchor="middle">0.3s crossfade</text>
  </g>`;
}

// The Ferryman — a Room migration. Canon: a shape poling flat dark water, never
// given a face, and on dry ground it does not exist. One way, one toll, no appeal.
function ferryman(accent) {
  return `
  <g>
    ${halo(accent)}
    <!-- flat dark water -->
    <path d="M20 400 H360" stroke="${accent}" stroke-opacity="0.55" stroke-width="2.5"/>
    <g stroke="${accent}" stroke-opacity="0.22" stroke-width="2" stroke-linecap="round">
      <path d="M40 424 H120 M150 424 H236 M266 424 H340 M70 448 H160 M196 448 H300 M110 470 H250"/>
    </g>
    <!-- the punt -->
    <path d="M62 398 L318 398 L292 432 L88 432 Z" fill="#0B1219" stroke="${accent}" stroke-opacity="0.85" stroke-width="3" stroke-linejoin="round"/>
    <!-- the poler: tall, faceless, given no features at all, per canon -->
    <path d="M156 186 C 156 150, 214 150, 214 186 L242 396 H128 Z"
          fill="url(#cloak)" stroke="${accent}" stroke-opacity="0.9" stroke-width="3" stroke-linejoin="round"/>
    <path d="M185 130 C 210 130, 222 152, 219 178 C 214 206, 156 206, 151 178 C 148 152, 160 130, 185 130 Z"
          fill="#020407" stroke="${accent}" stroke-opacity="0.55" stroke-width="2.5"/>
    <!-- the pole, entering the water -->
    <path d="M256 104 L300 426" stroke="${accent}" stroke-opacity="0.85" stroke-width="5" stroke-linecap="round"/>
    <!-- the toll. paid once, in tape amber, no appeal -->
    <circle cx="96" cy="378" r="14" fill="${T.amber}" fill-opacity="0.85"/>
    <circle cx="96" cy="378" r="14" fill="none" stroke="${T.amber}" stroke-opacity="0.5" stroke-width="2"/>
    <text x="190" y="474" fill="${T.inkFaint}" font-family="${T.mono}" font-size="22" text-anchor="middle">one way</text>
  </g>`;
}

// The Vault Keeper — Keystore and SQLCipher. From the Keeper: a figure assembled
// literally out of the hardware of not opening a door. Hinges, panels, deadbolts.
function vaultKeeper(accent) {
  return `
  <g>
    ${halo(accent)}
    <!-- torso is a door panel -->
    <rect x="118" y="196" width="144" height="230" rx="8" fill="#0B1219" stroke="${accent}" stroke-opacity="0.9" stroke-width="3"/>
    <rect x="140" y="222" width="100" height="78" rx="4" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="2"/>
    <rect x="140" y="318" width="100" height="78" rx="4" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="2"/>
    <!-- head: a lock escutcheon, keyhole for a face -->
    <rect x="150" y="112" width="80" height="76" rx="10" fill="#0B1219" stroke="${accent}" stroke-opacity="0.9" stroke-width="3"/>
    <circle cx="190" cy="142" r="13" fill="#020407" stroke="${accent}" stroke-opacity="0.8" stroke-width="2.5"/>
    <path d="M190 152 L183 174 H197 Z" fill="#020407" stroke="${accent}" stroke-opacity="0.8" stroke-width="2.5" stroke-linejoin="round"/>
    <!-- hinge shoulders, three leaves each -->
    <g fill="#0E1620" stroke="${accent}" stroke-opacity="0.75" stroke-width="2.5">
      <rect x="92" y="210" width="28" height="42" rx="5"/><rect x="92" y="264" width="28" height="42" rx="5"/><rect x="92" y="318" width="28" height="42" rx="5"/>
      <rect x="260" y="210" width="28" height="42" rx="5"/><rect x="260" y="264" width="28" height="42" rx="5"/><rect x="260" y="318" width="28" height="42" rx="5"/>
    </g>
    <!-- deadbolt arms, thrown -->
    <path d="M288 232 H348" stroke="${accent}" stroke-opacity="0.9" stroke-width="11" stroke-linecap="round"/>
    <path d="M92 340 H32" stroke="${accent}" stroke-opacity="0.9" stroke-width="11" stroke-linecap="round"/>
    <!-- the arc it swings on, always returning to block the one frame it guards -->
    <path d="M60 452 A 150 150 0 0 1 320 452" fill="none" stroke="${accent}" stroke-opacity="0.22" stroke-width="2" stroke-dasharray="8 10"/>
    <text x="190" y="480" fill="${T.inkFaint}" font-family="${T.mono}" font-size="22" text-anchor="middle">you built me</text>
  </g>`;
}

// The Second Witness — the IMU. Cannot tell you where. Knows for certain whether.
// A gimbal that is honest about exactly one question.
function secondWitness(accent) {
  return `
  <g>
    ${halo(accent)}
    <!-- gimbal rings -->
    <ellipse cx="190" cy="228" rx="132" ry="132" fill="none" stroke="${accent}" stroke-opacity="0.75" stroke-width="3"/>
    <ellipse cx="190" cy="228" rx="132" ry="52" fill="none" stroke="${accent}" stroke-opacity="0.5" stroke-width="2.5"/>
    <ellipse cx="190" cy="228" rx="52" ry="132" fill="none" stroke="${accent}" stroke-opacity="0.5" stroke-width="2.5"/>
    <!-- the mass at the centre, hanging true -->
    <circle cx="190" cy="228" r="27" fill="#0B1219" stroke="${accent}" stroke-opacity="0.95" stroke-width="3"/>
    <circle cx="190" cy="228" r="8" fill="${accent}"/>
    <path d="M190 255 V318" stroke="${accent}" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="5 7"/>
    <path d="M190 318 l-9 -16 h18 Z" fill="${accent}" fill-opacity="0.7"/>
    <!-- the trace: flat, flat, flat, then the one spike it will swear to -->
    <path d="M40 424 H150 L164 424 L172 392 L182 452 L192 410 L202 428 H340"
          fill="none" stroke="${T.amber}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    <text x="190" y="480" fill="${T.amber}" font-family="${T.mono}" font-size="22" text-anchor="middle">it moved</text>
  </g>`;
}

// The Archivist — provenance and invariants. Meticulous, unglamorous, faintly smug.
// Nobody thanks it until a number is disputed.
function archivist(accent) {
  return `
  <g>
    ${halo(accent)}
    <!-- a body made of filing drawers -->
    <g fill="#0B1219" stroke="${accent}" stroke-opacity="0.85" stroke-width="2.5">
      <rect x="112" y="206" width="156" height="62" rx="6"/>
      <rect x="112" y="276" width="156" height="62" rx="6"/>
      <rect x="112" y="346" width="156" height="62" rx="6"/>
    </g>
    <g stroke="${accent}" stroke-opacity="0.6" stroke-width="3" stroke-linecap="round">
      <path d="M170 237 H210 M170 307 H210 M170 377 H210"/>
    </g>
    <!-- one drawer pulled, because it always has the receipt -->
    <path d="M268 276 H320 V338 H268" fill="#0E1620" stroke="${accent}" stroke-opacity="0.7" stroke-width="2.5"/>
    <!-- head: a stamp -->
    <rect x="150" y="128" width="80" height="52" rx="7" fill="#0B1219" stroke="${accent}" stroke-opacity="0.9" stroke-width="3"/>
    <path d="M176 128 V104 H204 V128" fill="none" stroke="${accent}" stroke-opacity="0.8" stroke-width="3"/>
    <path d="M150 186 H230" stroke="${accent}" stroke-opacity="0.5" stroke-width="2.5"/>
    <!-- chain of custody tags, in tape amber, because they cannot lie -->
    <g transform="translate(300 172) rotate(9)">
      <rect x="0" y="0" width="76" height="40" rx="5" fill="${T.paper}" stroke="#B9AC90" stroke-width="1.5"/>
      <path d="M10 14 H62 M10 26 H48" stroke="#8E856F" stroke-width="3" stroke-linecap="round"/>
      <circle cx="6" cy="6" r="3.5" fill="none" stroke="#8E856F" stroke-width="1.5"/>
    </g>
    <text x="190" y="452" fill="${T.amber}" font-family="${T.mono}" font-size="20" text-anchor="middle">confidence: 0.62</text>
    <text x="190" y="480" fill="${T.inkFaint}" font-family="${T.mono}" font-size="20" text-anchor="middle">source: fused</text>
  </g>`;
}

// The Understudy — a KMP `actual`. Cast by name at compile time, on stage every
// night, and you cannot swap it mid-run.
function understudy(accent) {
  return `
  <g>
    ${halo(accent)}
    <!-- proscenium -->
    <path d="M40 130 H340" stroke="${accent}" stroke-opacity="0.55" stroke-width="3"/>
    <path d="M40 130 C 74 178, 74 236, 58 300 L40 300 Z" fill="#0B1219" stroke="${accent}" stroke-opacity="0.45" stroke-width="2"/>
    <path d="M340 130 C 306 178, 306 236, 322 300 L340 300 Z" fill="#0B1219" stroke="${accent}" stroke-opacity="0.45" stroke-width="2"/>
    <!-- one spotlight, fixed, non-negotiable -->
    <path d="M190 130 L104 396 H276 Z" fill="${T.amber}" fill-opacity="0.09"/>
    <!-- the stand-in: a mask on a stick, no body behind it -->
    <path d="M190 214 C 220 214, 236 238, 232 268 C 228 300, 204 316, 190 316 C 176 316, 152 300, 148 268 C 144 238, 160 214, 190 214 Z"
          fill="#0E1620" stroke="${accent}" stroke-opacity="0.9" stroke-width="3"/>
    <ellipse cx="174" cy="258" rx="9" ry="5" fill="#020407"/>
    <ellipse cx="206" cy="258" rx="9" ry="5" fill="#020407"/>
    <path d="M174 288 C 184 296, 196 296, 206 288" fill="none" stroke="${accent}" stroke-opacity="0.55" stroke-width="2.5"/>
    <path d="M190 316 V400" stroke="${accent}" stroke-opacity="0.8" stroke-width="5" stroke-linecap="round"/>
    <!-- the role it was cast for, nailed to the boards -->
    <path d="M104 400 H276" stroke="${accent}" stroke-opacity="0.6" stroke-width="3"/>
    <text x="190" y="444" fill="${T.inkFaint}" font-family="${T.mono}" font-size="21" text-anchor="middle">actual fun clipboard()</text>
    <text x="190" y="476" fill="${T.amber}" font-family="${T.mono}" font-size="20" text-anchor="middle">cast at compile time</text>
  </g>`;
}

// The Fleet — the crew of AI agents. A captain who routes and never rows, and
// workers who do the volume. Mutiny sinks the ship and the token budget.
function fleet(accent) {
  const worker = (x, y, s) => `
    <g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-38 0 H38 L26 26 H-26 Z" fill="#0B1219" stroke="${accent}" stroke-opacity="0.7" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M0 0 V-30" stroke="${accent}" stroke-opacity="0.6" stroke-width="2.5"/>
      <path d="M0 -30 L24 -12 H0 Z" fill="${accent}" fill-opacity="0.25" stroke="${accent}" stroke-opacity="0.6" stroke-width="2"/>
    </g>`;
  return `
  <g>
    ${halo(accent)}
    <!-- the captain: bigger, higher, and holding no oar -->
    <g transform="translate(190 216)">
      <path d="M-56 0 H56 L38 38 H-38 Z" fill="#0E1620" stroke="${accent}" stroke-opacity="0.95" stroke-width="3" stroke-linejoin="round"/>
      <path d="M0 0 V-48" stroke="${accent}" stroke-opacity="0.85" stroke-width="3"/>
      <path d="M0 -48 L36 -22 H0 Z" fill="${T.amber}" fill-opacity="0.35" stroke="${T.amber}" stroke-opacity="0.7" stroke-width="2"/>
      <circle cx="0" cy="-56" r="7" fill="${T.amber}"/>
    </g>
    <!-- routing lines: it never rows, it only points -->
    <g stroke="${accent}" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="6 8">
      <path d="M150 258 L92 342 M190 262 L190 350 M230 258 L288 342"/>
    </g>
    ${worker(92, 350, 0.82)}${worker(190, 358, 0.82)}${worker(288, 350, 0.82)}
    <text x="190" y="452" fill="${T.inkFaint}" font-family="${T.mono}" font-size="21" text-anchor="middle">opus routes · sonnet rows</text>
    <text x="190" y="480" fill="${T.amber}" font-family="${T.mono}" font-size="20" text-anchor="middle">tiers are roles, not ranks</text>
  </g>`;
}

// The Backlog — the pile that regrows. Cut one head, two arrive. You do not defeat
// it; you learn to live beside it.
function backlog(accent) {
  const head = (x, y, r) => `
    <g transform="translate(${x} ${y}) rotate(${r})">
      <rect x="-34" y="-24" width="68" height="48" rx="6" fill="#0B1219" stroke="${accent}" stroke-opacity="0.85" stroke-width="2.5"/>
      <path d="M-20 -6 H20 M-20 8 H8" stroke="${accent}" stroke-opacity="0.45" stroke-width="3" stroke-linecap="round"/>
    </g>`;
  return `
  <g>
    ${halo(accent)}
    <!-- the pile it grows out of -->
    <path d="M40 442 C 84 396, 296 396, 340 442 Z" fill="#0B1219" stroke="${accent}" stroke-opacity="0.6" stroke-width="2.5"/>
    <!-- necks -->
    <g fill="none" stroke="${accent}" stroke-opacity="0.55" stroke-width="7" stroke-linecap="round">
      <path d="M150 424 C 130 356, 96 320, 76 276"/>
      <path d="M176 424 C 168 350, 154 300, 146 222"/>
      <path d="M204 424 C 212 352, 228 306, 240 240"/>
      <path d="M230 424 C 254 366, 288 336, 312 296"/>
      <path d="M190 424 C 190 372, 188 340, 186 312"/>
    </g>
    ${head(76, 262, -22)}${head(146, 208, -8)}${head(240, 226, 10)}${head(312, 282, 24)}
    <!-- one freshly cut, and the two already arriving -->
    <path d="M170 300 L206 324" stroke="${T.danger}" stroke-opacity="0.8" stroke-width="4" stroke-linecap="round"/>
    <text x="190" y="480" fill="${T.inkFaint}" font-family="${T.mono}" font-size="21" text-anchor="middle">cut one, two arrive</text>
  </g>`;
}

// Null — the oldest bug. Kotlin built a type system to keep it out. The portrait is
// an absence: a body-shaped hole where a value was supposed to be.
function nullEntity(accent) {
  return `
  <g>
    ${halo(accent)}
    <!-- the outline of someone who is not there. head and shoulders drawn as
         separate strokes so the absence has a readable body, not a blob -->
    <circle cx="190" cy="176" r="52" fill="#010204" stroke="${accent}" stroke-opacity="0.8"
            stroke-width="3" stroke-dasharray="15 11"/>
    <path d="M78 430 C 82 340, 128 268, 190 268 C 252 268, 298 340, 302 430"
          fill="#010204" stroke="${accent}" stroke-opacity="0.8" stroke-width="3"
          stroke-dasharray="15 11" stroke-linecap="round"/>
    <!-- where the value should have been. it does not reflect the grid behind it -->
    <circle cx="190" cy="358" r="46" fill="#000000"/>
    <circle cx="190" cy="358" r="46" fill="none" stroke="${T.danger}" stroke-opacity="0.85" stroke-width="4"/>
    <path d="M158 390 L222 326" stroke="${T.danger}" stroke-opacity="0.85" stroke-width="4" stroke-linecap="round"/>
    <text x="190" y="480" fill="${T.danger}" font-family="${T.mono}" font-size="22" text-anchor="middle">NullPointerException</text>
  </g>`;
}

// The Hunter — the version of him that does not leave. Canon is explicit and it is
// the whole point: human-shaped, YOUR OWN silhouette, desaturated, and in the
// Prologue it waves. Deliberately drawn in grey, not the series accent. It is the
// only cast member that does not get the brand colour, because it is not a bug.
function hunter(accent) {
  const grey = "#6E7A88";
  return `
  <g>
    <circle cx="190" cy="205" r="165" fill="url(#halo)" opacity="0.35"/>
    <!-- the gap. impassable, and the gesture is the whole interaction -->
    <path d="M20 452 H126" stroke="${accent}" stroke-opacity="0.5" stroke-width="3"/>
    <path d="M254 452 H360" stroke="${grey}" stroke-opacity="0.6" stroke-width="3"/>
    <g stroke="${T.inkFaint}" stroke-opacity="0.28" stroke-width="2">
      <path d="M126 452 L138 496 M158 458 L168 500 M212 458 L204 500 M254 452 L242 496"/>
    </g>
    <!-- him, one iteration behind. head and torso drawn separately so the
         silhouette reads as a person and not a headstone -->
    <circle cx="182" cy="176" r="46" fill="#141B24" stroke="${grey}" stroke-opacity="0.9" stroke-width="3"/>
    <path d="M96 452 C 100 356, 136 268, 182 268 C 228 268, 264 356, 268 452 Z"
          fill="#141B24" stroke="${grey}" stroke-opacity="0.9" stroke-width="3" stroke-linejoin="round"/>
    <!-- the wave. frozen at the top of its motion, forever about to be friendly -->
    <path d="M252 320 C 288 306, 308 268, 306 226" fill="none" stroke="${grey}" stroke-opacity="0.9" stroke-width="17" stroke-linecap="round"/>
    <circle cx="306" cy="212" r="19" fill="#141B24" stroke="${grey}" stroke-opacity="0.9" stroke-width="3"/>
    <text x="190" y="486" fill="${grey}" font-family="${T.mono}" font-size="21" text-anchor="middle">iteration 51 · completed</text>
  </g>`;
}

const CAST = {
  "the-messenger": {
    draw: messenger, name: "THE MESSENGER", className: "CancellationException",
    line: "It only ever delivers a note.",
  },
  "the-concussed-witness": {
    draw: concussedWitness, name: "THE CONCUSSED WITNESS", className: "LocationManager",
    line: "Confident. Cooperative. Often wrong.",
  },
  "doze-the-jailer": {
    draw: jailer, name: "DOZE THE JAILER", className: "startForeground()",
    line: "You get five seconds to explain yourself.",
  },
  "the-recomposer": {
    draw: recomposer, name: "THE RECOMPOSER", className: "@Composable",
    line: "It redraws the room every time you blink.",
  },
  "the-ferryman": {
    draw: ferryman, name: "THE FERRYMAN", className: "Migration(23, 24)",
    line: "The boat only rows one way.",
  },
  "the-vault-keeper": {
    draw: vaultKeeper, name: "THE VAULT KEEPER", className: "AndroidKeyStore",
    line: "It guards the keys perfectly. Including from you.",
  },
  "the-second-witness": {
    draw: secondWitness, name: "THE SECOND WITNESS", className: "Sensor.TYPE_ACCELEROMETER",
    line: "Cannot say where. Knows whether.",
  },
  "the-archivist": {
    draw: archivist, name: "THE ARCHIVIST", className: "Provenance",
    line: "You cannot backfill confidence you discarded.",
  },
  "the-understudy": {
    draw: understudy, name: "THE UNDERSTUDY", className: "actual",
    line: "Cast by name at compile time. No swapping mid-run.",
  },
  "the-fleet": {
    draw: fleet, name: "THE FLEET", className: "AgentHarness",
    line: "The captain routes. The captain never rows.",
  },
  "the-backlog": {
    draw: backlog, name: "THE BACKLOG", className: "// TODO",
    line: "You do not defeat it. You learn to live beside it.",
  },
  "null": {
    draw: nullEntity, name: "NULL", className: "T?",
    line: "The antagonist that predates all the others.",
  },
  "the-hunter": {
    draw: hunter, name: "THE HUNTER", className: "iteration 51",
    line: "It is not chasing you. It is waiting for you to settle.",
  },
};

export const castIds = () => Object.keys(CAST);

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
