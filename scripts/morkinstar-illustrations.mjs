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
  "Ink and wash on aged foxed paper, loose confident pen linework, heavy crosshatching, a single " +
  "muted sepia tone, the register of a nineteenth century naturalist's field plate. The MEDIUM is " +
  "restrained and hand-drawn; the SUBJECT is not of this world. This is a rendering produced by a " +
  "translation instrument, so it may resolve cleanly, or strain, or fail at its edges. " +
  "CRITICAL: the subject is a non-human intelligent being. Not a person in costume. Not a human " +
  "with an ornament. No human clothing of any period, no coats, no hats, no spectacles. " +
  "Emotion must be carried by posture, tension and where the attention is aimed, NOT by a human " +
  "face and NOT by eyes. Several of these have no face at all. " +
  "The HANDS or manipulators must stay clearly legible and busy with their task: that is the " +
  "entire emotional anchor of the image. However strange the body, the hands read as a person " +
  "doing careful work. " +
  "Absolutely no text, lettering, captions, signatures, numerals, borders or frames.";

// The tellers. Each is a real person inside a story, named in the canon, and the
// brief is the one thing that story says they DID, because that is what a field
// sketch is of: not a face, a person caught mid-doing.
const WITNESSES = [
  { id: "feeriko", from: "s1-01",
    brief: "A tall narrow non-human figure seated cross-legged on sea ice beside a cut fishing hole, mid-sentence, one long hand raised in explanation. God-blooded: cold light moves under translucent skin, and overlapping serpent scales surface along the forearms where frost once bit. Fine snow is falling OUT of the figure rather than onto it, drifting up off the shoulders. Long multi-jointed fingers, entirely legible. Exhausted and animated at once. She has been talking a very long time and cannot stop." },
  { id: "tveggi", from: "s1-02",
    brief: "A small non-human child-form kneeling on ice, cutting a single vertical mark into flat stone with a burnt stick. The world around is smeared and vibrating with sound made visible, all motion and interference. The figure alone is drawn in absolute stillness, perfectly sharp, silent. Along the lower jaw of this species runs a long fringed sensory membrane; on this one the jaw is smooth and bare, the membrane absent. The cut mark is the single brightest thing in the frame." },
  { id: "soebra", from: "s1-03",
    brief: "A low wide-stanced non-human form crouched in a small boat, long prehensile toes gripping the hull, writing fast onto wet bark with a fine stylus. Spray coming over the side. The tally being written runs off the bark, over the gunwale, out across the water in a continuous line to the horizon and does not end. The bark is already smouldering at one corner in the hands that hold it." },
  { id: "soelvi", from: "s1-04",
    brief: "A lone non-human figure walking an empty road under an empty sky. The body is bilaterally asymmetric: one entire side is formed to interlock with a second body, with a shortened shoulder, a socketed flank and a hand shaped to fit another hand. Beside that side, where the pair should be, there is a clean torn HOLE IN THE PAPER in the shape of a person. Not a ghost, not a shadow: an absence with a hard edge. The figure gestures toward it, mid-conversation." },
  { id: "aedri", from: "s1-05",
    brief: "Two non-human forms in a full two-armed embrace in a doorway. The near one is drawn in dense ink and blooming heat, with broad flanged heat-shedding plates along the forearms and spine that have spread open with the arms. The one being held is drawn in NOTHING: an unrendered void in the exact shape of a held body, blank paper. The warm one's hands are locked and counting." },
  { id: "hild-ronn", from: "s1-06",
    brief: "An enormous columnar non-human form, massively built and heat-retaining, standing waist deep in a narrow grave shaft on a cold ridge. Behind and beside it a line of upright buried forms recedes to the horizon and beyond, thousands upon thousands, every one aimed the same way. The great blunt hands set a fitted stone, and among the blunt digits is one small precise finger doing the fine work. Scale: the figure dwarfs the shaft, the shaft dwarfs the viewer." },
  { id: "the-cendran-child", from: "s1-07",
    brief: "A very small non-human child-form seated alone on the floor of a plain empty room, holding an oversized stylus in both hands over one blank page. Behind, filling most of the frame, an enormous fire consuming a mountain of pages, ninety-one burnings' worth. The blank page in the small hands is the brightest object in the image. The room contains no books at all." },
  { id: "ilta", from: "s1-08",
    brief: "A non-human figure caught mid-stride, walking around behind something vast. That vast thing is rendered so both of its facings are visible at once in a single impossible silhouette: a giving, opening, benevolent form and a taking, closing, devouring form occupying the same outline simultaneously. Everyone else in the scene faces the other way and sees only one of them. She is the only one moving, and the only one positioned to see both." },
  { id: "ossul", from: "s2-01",
    brief: "A REFUSAL of a portrait. A small windowless archive room nine decks down, one oil lamp, a desk, shelves of bundled unread queues. On the desk, two clearly drawn non-human hands at work on paperwork. Where the body and head should resolve, the rendering does not: the figure breaks up into unresolved paper grain, hatching that fails, blank ground. Beside the desk, plainly drawn and completely solid, an empty second chair carried in from somewhere else." },
  { id: "hallovar", from: "s2-04",
    brief: "One frame holding two scales at once. In the foreground a non-human teacher-form at a lectern, tired, mid-lesson, writing with many-jointed hands, one of which is visibly unsteady. Behind and around, the same figure rendered at the scale of a world, hands braced against the tilted axis of a planet, holding its seasons still. Students out of focus below. Both scales are true at the same time and one of them is running out of time." },
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
