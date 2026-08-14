#!/usr/bin/env node
// The Morkinstar Journals — portraits of the witnesses.
//
//   with-openrouter node scripts/morkinstar-illustrations.mjs --probe
//   with-openrouter node scripts/morkinstar-illustrations.mjs
//
// WHY THIS EXISTS SEPARATELY FROM THE PLATES. The field plates draw mechanism
// and the sigils are geometry hashed from a name. Both are correct for what they
// depict: an institution's survey form, and abstractions that have no face. The
// people have had nothing, and the people are the entire thesis. Canon law five:
// the heroes lose, and the tellers are why there is a story at all.
//
// So the abstractions get marks and the witnesses get faces.
//
// WHY IT CALLS THE API DIRECTLY. `openrouter ask` is a text interface. Image
// models return the image in choices[].message.images[].image_url.url as a data
// URI and leave the text content empty, so the CLI bills the generation and
// prints nothing. Measured 2026-08-15: one probe cost $0.0672 and returned an
// empty string. This talks to /chat/completions and reads the right field.
//
// SPEND. Every run prints an estimate before the first call and the measured
// total after the last one. --probe does exactly one image so the cost of
// finding out something is broken stays near zero.
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "fiction/morkinstar-journals/assets/witnesses");

const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) {
  console.error("No OPENROUTER_API_KEY. Run this through: with-openrouter node scripts/morkinstar-illustrations.mjs");
  process.exit(1);
}

const MODEL = process.env.ILLUSTRATION_MODEL || "google/gemini-3-pro-image";
const PROBE = process.argv.includes("--probe");
const FORCE = process.argv.includes("--force");

// One house style, stated once, so twenty portraits read as one hand rather than
// twenty prompts. Ink and wash on aged paper is the right register: this is a
// correspondent's field journal, and a field journal is drawn, not photographed.
const STYLE =
  "Hand-drawn ink and wash portrait in the style of a nineteenth century naturalist's field journal. " +
  "Loose confident pen linework with visible crosshatching, a single muted wash tone, aged paper ground with " +
  "slight foxing at the edges. Warm, particular, human, a little caricatured in the way a good field sketch " +
  "exaggerates the one feature the artist actually noticed. Not photorealistic, not digital painting, not 3D. " +
  "Absolutely no text, no lettering, no captions, no signatures, no borders or frames anywhere in the image.";

// The tellers. Each is a real person inside a story, named in the canon, and the
// brief is the one thing that story says they DID, because that is what a field
// sketch is of: not a face, a person caught mid-doing.
const WITNESSES = [
  { id: "feeriko", from: "s1-01",
    brief: "A young woman in heavy fur-lined winter clothing, sitting cross-legged on sea ice beside a fishing hole, mid-sentence, one hand raised in explanation. She is talking someone out of giving up and she has been talking for a long time. Exhausted and animated at once." },
  { id: "tveggi", from: "s1-02",
    brief: "A deaf child kneeling on ice in a thin freezing landscape, scratching a single vertical mark into flat stone with a burnt stick. Total concentration. She is the only person on her world who can still count, and she has just realised a name does not have to be a sound." },
  { id: "soebra", from: "s1-03",
    brief: "A middle-aged clerk in a small boat, hunched protectively over a wet bark scroll, writing fast in shorthand while spray comes over the side. A tally-keeper doing her job in bad conditions while something enormous happens just out of frame." },
  { id: "soelvi", from: "s1-04",
    brief: "A lone figure walking an empty road under a completely empty sky, mouth open, speaking aloud to nobody at their left shoulder. The posture of conversation: head slightly turned, hand gesturing to a listener who is not there." },
  { id: "aedri", from: "s1-05",
    brief: "A woman holding a stranger in a full two-armed embrace in a doorway, eyes open over the stranger's shoulder, counting. Warmth and vigilance in the same face at the same moment." },
  { id: "hild-ronn", from: "s1-06",
    brief: "A stonemason, powerfully built, standing waist-deep in a narrow grave shaft she has just dug, looking up along a ridge line. A surveying instrument of stone rests on the lip of the shaft beside her hands." },
  { id: "the-cendran-child", from: "s1-07",
    brief: "A six or seven year old child sitting alone on the floor of a plain room with one window, holding an oversized stylus, one blank page in front of them. The room is completely empty of books. They have been asked for one thing nobody has ever said." },
  { id: "ilta", from: "s1-08",
    brief: "An ordinary, slightly irritating-looking woman caught mid-stride walking around behind something very large that is deliberately left out of frame. Everyone else in the scene faces the other way. She is the only one moving." },
  { id: "ossul", from: "s2-01",
    brief: "An old archive clerk at a desk in a small windowless room nine decks down, one lamp, shelves of unread queues behind him. A second chair sits beside the desk, empty, plainly carried in from somewhere else." },
  { id: "hallovar", from: "s2-04",
    brief: "An ageing teacher at a lectern, mid-lesson, one hand shaking slightly as he writes. Students out of focus in front of him. He is patient and visibly tired and he is running out of time and knows the exact hour." },
];

const est = (n) => (n * 1290 * 12) / 1e6; // gemini-3-pro-image: ~1290 out tok/image, $12/Mtok
const list = PROBE ? WITNESSES.slice(0, 1) : WITNESSES;

console.log(`\n⚠  OPENROUTER (paid) — ${MODEL}`);
console.log(`   why:  raster illustration is a capability gap, not a reasoning one`);
console.log(`   est:  ${list.length} image(s) → ~$${est(list.length).toFixed(3)} (estimate, NOT a cap)\n`);

mkdirSync(OUT, { recursive: true });
let spent = 0, made = 0, failed = 0;

for (const w of list) {
  const file = join(OUT, `${w.id}.png`);
  if (existsSync(file) && !FORCE) { console.log(`  ${w.id}: exists, skipping (--force to redraw)`); continue; }
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        // Without this, an image-capable model happily answers in prose.
        modalities: ["image", "text"],
        messages: [{ role: "user", content: `${STYLE}\n\nSubject: ${w.brief}` }],
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
    console.log(`  ${w.id}  ← ${w.from}`);
  } catch (e) {
    failed++;
    console.warn(`  ${w.id}: ${e.message}`);
  }
}

console.log(`\n── ${made} drawn, ${failed} failed · measured $${spent.toFixed(4)} on ${MODEL}`);
if (failed && !made) console.log("   Nothing was produced. Check the response shape before spending again.");
