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
  "Absolutely no text, lettering, captions, signatures or numerals. " +
  // The negative below is emphatic and repeated because the probe on 2026-08-25
  // ignored the single-word version: "nineteenth century naturalist's field
  // plate" positively implies a plate WITH a ruled border, and that beat the
  // negative. The border matters more than it looks. These portraits are cut
  // off their paper by a flat-field matte that keeps ink and drops ground, so a
  // drawn border is ink and survives as exactly the hard rectangle the matte
  // exists to remove: the "pasted grey box" defect from the 2026-08-15 art pass.
  "NO BORDER OF ANY KIND. No ruled line, no frame, no inset rectangle, no plate " +
  "edge, no corner marks, no vignette box, no darkened corners. The drawing sits " +
  "in open paper and the paper runs to all four edges of the image. Nothing " +
  "encloses the subject. If a border seems implied by the style, omit it.";

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
  // ── Season two and three tellers, harvested from the prose 2026-08-25 ──────
  // Canon law five says an entry whose teller cannot be named is not finished.
  // These ten were named in the text all along and never drawn. Ræl and Tuvid
  // from page 73 are deliberately absent: #s3-11 is the page that is four names
  // and nothing else, and he can place two of them. Drawing the other two would
  // delete the entry. Same rule as Ossul's refusal above.
  { id: "emmerin", from: "s2-02",
    brief: "A broad low non-human form standing alone on a wide salt flat at dusk, one arm half-raised, caught in the instant of saying something out loud that was not true yet. Absolutely nothing is happening in the landscape and that is the subject. The species carries a long dorsal cord of fine filaments that reads humidity; hers hang completely slack in still air. Above the raised hand, and only there, a single small patch of rain is falling out of a clear sky, drawn precisely, no cloud attached. Ordinary evening, one impossible thing in it, nobody reacting." },
  { id: "the-dhurin-examiner", from: "s2-03",
    brief: "A heavy-shouldered non-human investigator-form seated across a wide table from the viewer, sliding a thick case bundle forward with both flat manipulators, having just finished being kind about something. Her carapace is worn matte at the forearms from four thousand clicks of exactly this motion. Behind her the wall is covered floor to ceiling in identical unopened case bundles, receding further than the room can be. Patient and completely unhopeful in the same posture." },
  { id: "ilvra", from: "s2-04",
    brief: "A tall thin non-human keeper-form in a bare stone room, holding out a single sheet toward the viewer with both hands, offering it, at the exact moment of letting a stranger take it. The room's walls are stacked with thousands of attempts at the same lesson, all slightly different, all incomplete. Her hands are steady and the sheet is not shaking. Six generations of the same careful grip have polished the stone sill behind her to a shine." },
  { id: "yssa", from: "s2-05",
    brief: "A slight non-human figure sitting down beside someone on a dock at the end of a working day, turned toward them, mid-offer, having just asked something a second time and quietly. The species communicates through a throat resonator that is visibly still; she is using the difficult method instead. Between the two of them, drawn solid and physical, sits a small closed object neither is looking at. Warm and braced for a no." },
  { id: "torsa", from: "s2-08",
    brief: "A weathered non-human observer-form standing on a stone terrace at night beside a sighting instrument, one manipulator resting on it, mid-sentence, saying a thing slowly that she has said many times. She is not looking at the sky, she is looking at whoever she is explaining it to. The instrument is aimed at a patch of sky that is completely empty. Four hours of work has produced nothing yet and her posture says that is correct." },
  { id: "soelrun", from: "s3-02",
    brief: "An old non-human figure crouched beside somebody else's burning, tending it with a long tool, entirely competent, entirely absorbed. Around her at the edge of the frame stand a hundred and six small unmarked stones, none of them hers, drawn with enormous care. Her own carving hand rests in her lap, closed. Forty years of doing this well for other people." },
  { id: "yska", from: "s3-09",
    brief: "A very old non-human form seated on the floor past midnight opposite a stylus and an open page, one long manipulator raised in the act of repeating a syllable for the second time, exactly as before. She is dictating a lineage nobody has ever written down. Behind her the line of her ancestors is drawn as a receding row of figures that grows fainter and simply stops, one figure short, at her. The stylus is the only sharp thing in the frame." },
  { id: "orvaskt", from: "s3-07",
    // Reworded 2026-08-25. The first version asked for "a clean unrendered gap
    // in the drawing", which is an instruction about the artwork rather than a
    // thing in the scene, and the model returned a refusal with no image. Same
    // idea, stated as something physically present in the firelight.
    brief: "A stout elder non-human form doing most of the talking across a low cooking fire at night, one manipulator gesturing easily and warmly, mid-anecdote. A second figure of the same species tends the pot behind her and watches without speaking. Opposite her, seated where a guest would sit, the empty ground is bare: no figure, no outline, only an untouched place at the fire with the light falling across it. She is speaking directly to that empty place and is completely comfortable doing so." },
  { id: "sarn", from: "s3-11",
    brief: "A non-human teacher-form crouched on the ground writing a numeral sequence in reverse order, right to left, deliberately, for a student outside the frame. Her manipulators are precise and unhurried. The species signals amusement by a rippling of the dorsal plates and hers are rippling hard while the rest of the body stays completely composed. She is enjoying this and giving no sign a stranger would recognise." },
  { id: "oyla", from: "s3-11",
    brief: "A lean non-human skiff-hand standing at a dock gate in early light, mid-lie, saying something perfectly calm to an officer whose back is to us. One manipulator rests on a crate she is not supposed to have moved. Her whole posture is the practised stillness of somebody doing this for the second morning running for no reason she will explain. Behind her a ship is still there because of what she is saying." },
];

// Image models bill PER IMAGE, not per output token. The token estimate this
// used to carry (1290 tok x $12/Mtok = $0.0155) was 9x under the measured
// $0.1401 that gemini-3-pro-image actually charged on 2026-08-15, which is the
// specific trap image-generation/SKILL.md exists to stop. Quote the measured
// per-image rate, never the arithmetic.
const RATE = { "google/gemini-3-pro-image": 0.140, "google/gemini-3.1-flash-image": 0.030,
               "google/gemini-2.5-flash-image": 0.025, "openai/gpt-5-image": 0.190,
               "openai/gpt-5-image-mini": 0.050 };
const est = (n) => n * (RATE[MODEL] ?? 0.140);

// --probe draws ONE image so a broken style costs one image instead of twenty.
// It has to be the first image that does not exist yet: slicing the array at 0
// picked a witness already on disk, so the probe skipped, drew nothing, spent
// nothing and reported success, which is a probe that cannot fail.
// --probe targets the first witness with NO file on disk, and deliberately does
// NOT consult FORCE. Letting --force widen the probe's TARGET (rather than only
// its permission to overwrite) meant `--probe --force` selected witness zero and
// redrew a shipped portrait, destroying an approved asset to test a style change
// it was not even about. Recovered from git on 2026-08-25. Target selection and
// overwrite permission are different questions and this reads them separately.
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7);
const undrawn = WITNESSES.filter((w) => !existsSync(join(OUT, `${w.id}.png`)));
const list = ONLY
  ? WITNESSES.filter((w) => w.id === ONLY)
  : PROBE
    ? undrawn.slice(0, 1)
    : WITNESSES;
if (ONLY && !list.length) { console.error(`No witness with id "${ONLY}".`); process.exit(1); }

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
