#!/usr/bin/env node
// The Loopdown — cast portraits and series covers.
//
//   with-openrouter node scripts/loopdown-art.mjs --probe
//   with-openrouter node scripts/loopdown-art.mjs
//   with-openrouter node scripts/loopdown-art.mjs --only=doze-the-jailer,null
//
// Mirrors scripts/morkinstar-illustrations.mjs: direct /chat/completions call
// (openrouter-image and `openrouter ask` cannot return an image — see
// image-generation/SKILL.md), estimate before, measured total after, --probe
// draws exactly one (cast) image, existing files are skipped unless --force,
// --only=id,id targets specific ids without widening overwrite permission.
//
// WHY THIS EXISTS SEPARATELY FROM MORKINSTAR. Morkinstar draws witnesses to a
// world that has no face for its abstractions — ink and wash, sepia, a
// nineteenth-century field journal. The Loopdown IS an engineering casebook:
// Android platform limits, sensors, concurrency, tried as noir, courtroom and
// night-shift metaphors. Same discipline (one style block, one subject per
// brief, mid-action not portrait), different world, so a different file
// rather than a second style bolted onto the first.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CAST_OUT = join(ROOT, "lore/assets/cast");
const SERIES_OUT = join(ROOT, "lore/assets/series");
const MANIFEST = join(ROOT, "lore/assets/manifest.json");

const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) {
  console.error("No OPENROUTER_API_KEY. Run this through: with-openrouter node scripts/loopdown-art.mjs");
  process.exit(1);
}

const MODEL = process.env.ILLUSTRATION_MODEL || "google/gemini-3-pro-image";
const PROBE = process.argv.includes("--probe");
const FORCE = process.argv.includes("--force");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "")
  .slice(7).split(",").map((s) => s.trim()).filter(Boolean);

// One house style, stated once, so thirteen portraits and eight covers read
// as one hand. The Loopdown's register: an Android engineering casebook told
// as noir, courtroom and night-shift — a 1950s technical manual crossed with
// a detective pulp cover, not the sepia field-journal register Morkinstar
// owns already (that distinction is deliberate: two worlds, two hands).
const STYLE =
  "Bold brush-ink linework on flat graphite greys over a near-black ground: high-contrast noir " +
  "illustration, the composure of a 1950s technical manual crossed with a detective pulp cover. " +
  "Confident inked outlines, solid flat shadow shapes rather than rendered gradients, subtle " +
  "halftone grain across the dark areas like cheap newsprint. " +
  "Exactly ONE spot colour in the entire image: a single warm amber, hex #f2a13d, used ONLY on " +
  "the one detail that carries the lesson (a light, a dial, a single held object, a beam) — " +
  "never on skin, never as a wash, never covering more than a small deliberate area. Everything " +
  "else in the image is ink black, paper white and graphite grey. " +
  "Not photorealistic. Not 3D render. Not digital painting gloss, no soft airbrush blending, no " +
  "glow bloom. This is drawn, not rendered. " +
  "Absolutely no text, no lettering, no numerals, no captions, no signatures, no UI elements, no " +
  "logos. " +
  // Emphatic and repeated on purpose: the pulp-cover / technical-manual
  // register strongly implies a printed panel border, and a single mild
  // negative lost to that association on the first probe (2026-09-23),
  // producing a solid dark rectangular frame on all four sides.
  "NO BORDER OF ANY KIND. No ruled line, no panel frame, no inset rectangle, no cover-plate edge, " +
  "no corner marks, no vignette box, no darkened corners, no matte. The illustration bleeds " +
  "completely to all four edges of the canvas; the ink and grey ground touch every edge directly. " +
  "If a border or panel frame seems implied by the pulp-cover or manual register, omit it anyway " +
  "— nothing encloses the drawing.";

// The recurring cast (lore/cast.md), 13 entities. Each brief is the character
// MID-ACTION doing the thing its trait describes: one exaggerated feature,
// one emotional contradiction. Personified engineering entities, human-like
// or creature-like as their own trait demands — never a mascot costume.
const CAST = [
  { id: "the-concussed-witness",
    brief: "A bandaged figure standing at a street corner at night, one arm raised, pointing with total confidence down the wrong alley, entirely serene about it. A single amber streetlamp glow falls on the pointing hand and nowhere else. Exaggerated feature: a heavily bandaged head, wrapped like a patient who insists they are fine. Contradiction: perfectly certain and completely wrong at the same moment." },
  { id: "the-archivist",
    brief: "A fussy clerk mid-motion at a towering filing wall, stamping a fresh folder with one hand while the other hand pins down an older loose page before it can slide out of order, faintly smug. The stamp's single amber ink pad is the only colour in the frame. Exaggerated feature: an oversized loupe fixed permanently over one eye. Contradiction: unglamorous and quietly, completely in control." },
  { id: "the-second-witness",
    brief: "A stout, silent figure standing dead still with both broad palms flat against a wall in the dark, eyes shut, listening. One finger has just snapped upright in the instant of detecting the faintest tremor, and that single raised finger is lit amber. Exaggerated feature: oversized flat listening palms pressed wide against the surface. Contradiction: mute and totally decisive." },
  { id: "doze-the-jailer",
    brief: "A broad, unhurried jailer standing at a cell door at night, holding up a stopwatch in one hand, its single sweep hand almost at the top of the dial and the dial face left as a plain glowing amber disc with no numerals or markings visible, the other hand resting on the bolt, about to close it. Exaggerated feature: an enormous ring of keys hanging from the belt, none of them yet used. Contradiction: patient and utterly unmoved, already closing the door mid-explanation." },
  { id: "the-recomposer",
    brief: "A wiry gremlin perched on a ladder mid-brushstroke, repainting a completely empty room for what is clearly not the first time, brush loaded with the only amber paint in an otherwise grey room. Exaggerated feature: far too many small quick hands, all painting at once. Contradiction: compulsive and visibly bored by its own work." },
  { id: "the-understudy",
    brief: "A performer standing in the wings between two stage doorways, already dressed in the costume for a part that has just changed underneath them, one hand still adjusting a costume piece that no longer matches, a rack of other costumes hanging in the dark behind them, lit by a single amber work light overhead. No signage, no callsheet, no paper of any kind in the scene. Exaggerated feature: a costume visibly stitched from two mismatched halves. Contradiction: perfectly in position and already wrong." },
  { id: "the-messenger",
    brief: "A cloaked courier at a doorway at night, one hand extending a small folded note forward, the other arm raised defensively as unseen hands grab at the cloak from behind to strike the messenger down. The note is the only amber object in the frame. Exaggerated feature: a deep assassin's hood pushed back just enough to show a mild, apologetic face. Contradiction: menacing silhouette, harmless message, being killed for delivering it anyway." },
  { id: "the-ferryman",
    brief: "A cloaked ferryman mid-stroke poling a heavy-laden boat away from a crumbling dock, water rising fast behind, one hand still gripping the last passenger's wrist across the widening gap. A single amber lantern hangs from the boat's prow, the only warm light on the river. Exaggerated feature: an oar carved with a long tally of prior crossings. Contradiction: solemn duty and real tenderness in the same reaching hand." },
  { id: "the-vault-keeper",
    brief: "A heavy-set guardian standing before a great vault door, mid-turn of a key set into a lock built into their own chest, wincing at the final click. The single amber warning light above the lock is the only colour in the frame. Exaggerated feature: a ring of keys fused directly into the knuckles of one hand. Contradiction: absolute security and a private, personal loss in the same motion." },
  { id: "the-backlog",
    brief: "A many-necked hydra lunging to sever one of its own heads with a pair of shears held in a third arm, two new heads already budding at the stump before the cut lands, one budding head lit amber. Exaggerated feature: a small tag looped around one neck like a ticket stub. Contradiction: satisfied at the cut, visibly overtaken by what grows back." },
  { id: "the-fleet",
    brief: "A captain standing at a ship's helm at night, arms folded, one hand pointing decisively at a chart lit by a single amber lamp, while identical rowing figures strain at oars below deck in perfect unison. The captain's own hands are empty and clean. Exaggerated feature: a spyglass held permanently to one eye, never lowered. Contradiction: total command paired with total uninvolvement in the actual work." },
  { id: "the-borrowed-hand",
    brief: "A single oversized hand reaching up through a hatch in the floor, no arm attached, already closing around a half-finished blueprint held out to it. The blueprint's missing corner is filling itself in as pale amber smoke, plausible-looking but not quite what was drawn. Exaggerated feature: the hand is disproportionately large and careful, entirely alone in the frame. Contradiction: perfectly obedient and quietly improvising past where the instructions stopped." },
  { id: "null",
    brief: "A smooth, featureless black figure stepping directly out of a hairline crack in a wall at the worst possible moment, mid-step into a crowded room where every other figure has frozen in alarm. A single amber warning light on a nearby panel is the only colour in the frame, flickering. Exaggerated feature: no face at all, only a perfectly smooth black oval where one should be. Contradiction: a total absence that still commands the whole room." },
];

// Series covers (lore/series.md), 8 pillars. No text: the scene stages the
// pitch with its recurring cast, recognisable from the CAST briefs above.
const SERIES = [
  { id: "sensors-who-lie", cast_ids: ["the-concussed-witness"],
    brief: "A wide night street scene: the bandaged Concussed Witness stands at the centre pointing with total confidence down the wrong alley, one amber streetlamp lighting the gesture, while a loose ring of small instrument-figures lean in around it, trusting the pointed hand completely." },
  { id: "the-night-shift", cast_ids: ["doze-the-jailer"],
    brief: "A long prison corridor at night: Doze the Jailer stands at a cell door holding up a stopwatch that glows amber, a short queue of small worker-figures lined up outside each trying to make its case before the door swings shut." },
  { id: "ghosts-in-the-recomposition", cast_ids: ["the-recomposer"],
    brief: "An empty room mid-repaint at night: the Recomposer gremlin is up a ladder mid-brushstroke with an amber-loaded brush, the walls and furniture around it faintly doubled as if redrawn a moment ago, nobody else present to have asked for it." },
  { id: "the-coroutine-court", cast_ids: ["the-messenger"],
    brief: "A courtroom at night: the Messenger stands in the dock holding out a small folded note lit amber, a judge's raised gavel mid-swing toward it, the note the only piece of evidence anyone in the room is looking at." },
  { id: "crossing-the-schema", cast_ids: ["the-ferryman", "the-vault-keeper"],
    brief: "A wide river crossing at dusk: the Ferryman poles a laden boat with a single amber lantern at the prow away from a crumbling near shore, while on the far shore the Vault Keeper stands guard before a great vault door, both figures framed in one continuous crossing." },
  { id: "one-brain-two-bodies", cast_ids: ["the-understudy"],
    brief: "A backstage wing lit by one amber work light: the Understudy stands between two open stage doorways leading to two different sets, one arm reaching toward each, wearing a costume stitched from two mismatched halves." },
  { id: "chain-of-custody", cast_ids: ["the-archivist"],
    brief: "A vast records room: the Archivist stamps a fresh folder with a single amber ink pad while an endless chain of prior folders recedes into darkness behind, each one tied to the next by a physical cord." },
  { id: "notes-from-the-loop", cast_ids: ["the-fleet", "the-backlog"],
    brief: "A ship's deck at night: the Fleet's captain stands at the helm pointing at a chart lit by one amber lamp while rowers below deck strain in unison, and just off the bow the many-necked Backlog hydra keeps pace in the black water, one head freshly cut, two more rising." },
];

// Image models bill PER IMAGE, not per output token — see
// image-generation/SKILL.md and the 9x measured-vs-estimated gap it exists to
// stop. Quote the measured per-image rate, never token arithmetic.
const RATE = { "google/gemini-3-pro-image": 0.140, "google/gemini-3.1-flash-image": 0.030,
               "google/gemini-2.5-flash-image": 0.025, "openai/gpt-5-image": 0.190,
               "openai/gpt-5-image-mini": 0.050 };
const est = (n) => n * (RATE[MODEL] ?? 0.140);

const items = [
  ...CAST.map((c) => ({ ...c, kind: "cast", out: CAST_OUT, cast_ids: [c.id], series_ids: [] })),
  ...SERIES.map((s) => ({ ...s, kind: "series", out: SERIES_OUT, series_ids: [s.id] })),
];

// --probe draws ONE image so a broken style costs one image instead of
// twenty-one. It targets the first CAST item with no file on disk (per the
// task: "one cast image"), and deliberately does NOT consult FORCE — target
// selection and overwrite permission are different questions (see the
// morkinstar --probe --force incident this comment is copied from).
const undrawnCast = CAST.filter((c) => !existsSync(join(CAST_OUT, `${c.id}.png`)));
const list = ONLY.length
  ? items.filter((i) => ONLY.includes(i.id))
  : PROBE
    ? undrawnCast.slice(0, 1).map((c) => ({ ...c, kind: "cast", out: CAST_OUT, cast_ids: [c.id], series_ids: [] }))
    : items;
if (ONLY.length && !list.length) { console.error(`No item with id in "${ONLY.join(",")}".`); process.exit(1); }

console.log(`\n⚠  OPENROUTER (paid) — ${MODEL}`);
console.log(`   why:  raster illustration is a capability gap, not a reasoning one`);
console.log(`   est:  ${list.length} image(s) → ~$${est(list.length).toFixed(3)} (estimate, NOT a cap)\n`);

mkdirSync(CAST_OUT, { recursive: true });
mkdirSync(SERIES_OUT, { recursive: true });
let spent = 0, made = 0, failed = 0;
const drawn = [];

for (const it of list) {
  const file = join(it.out, `${it.id}.png`);
  if (existsSync(file) && !FORCE) { console.log(`  ${it.id}: exists, skipping (--force to redraw)`); continue; }
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        modalities: ["image", "text"],
        messages: [{ role: "user", content: `${STYLE}\n\nSubject: ${it.brief}` }],
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 160)}`);
    const j = await res.json();

    const usage = j.usage || {};
    spent += (usage.cost ?? 0);

    const url = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url?.startsWith("data:image")) {
      throw new Error(`no image in response (keys: ${Object.keys(j.choices?.[0]?.message ?? {}).join(",")})`);
    }
    writeFileSync(file, Buffer.from(url.split(",")[1], "base64"));
    made++;
    drawn.push({ id: it.id, kind: it.kind, cast_ids: it.cast_ids, series_ids: it.series_ids });
    console.log(`  ${it.id}  [${it.kind}]  cost $${(usage.cost ?? 0).toFixed(4)}`);
  } catch (e) {
    failed++;
    console.warn(`  ${it.id}: ${e.message}`);
  }
}

console.log(`\n── ${made} drawn, ${failed} failed · measured $${spent.toFixed(4)} on ${MODEL}`);
if (failed && !made) console.log("   Nothing was produced. Check the response shape before spending again.");

// Manifest: merge newly-drawn entries into the existing file rather than
// clobbering it, so a probe run followed by the full run (or a later
// --only redraw) accumulates instead of losing prior entries. `alt` is
// filled in by hand afterward (this script cannot judge its own output);
// leave a placeholder that's obviously unfinished if it's ever missed.
if (drawn.length) {
  const existing = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : [];
  const byId = new Map(existing.map((e) => [e.id, e]));
  for (const d of drawn) {
    const prev = byId.get(d.id) || {};
    byId.set(d.id, {
      id: d.id,
      kind: d.kind,
      file: `lore/assets/${d.kind}/${d.id}.png`,
      alt: prev.alt || "TODO: write the alt text (one sentence carrying the meaning, not the filename).",
      cast_ids: d.cast_ids,
      series_ids: d.series_ids,
      model: MODEL,
      generatedAt: new Date().toISOString(),
    });
  }
  writeFileSync(MANIFEST, JSON.stringify([...byId.values()], null, 2) + "\n");
  console.log(`   manifest: ${MANIFEST}`);
}
