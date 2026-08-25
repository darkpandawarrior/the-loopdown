---
title: "The Speaker Test"
type: reference
status: living
created: 2026-08-25
---

# Where the fiction ends and the record of making it begins

Written after an audit found production process printed inside the lore: a note on /canon saying
the first portraits "was the prompting, not the model", a Sources list whose links opened on the
working bibles, and a literal tool tag at the end of a published story that had been shipping
since the season landed.

The rule this replaces was correct and sat in the same file it was violated in.

## 1. The doctrine

Paste as a heading comment above any reader-facing fiction data (`src/data/canonLore.ts`, `src/data/anthology.ts`, the season routes) and at the top of the fiction corpus README.

```
/* THE SPEAKER TEST
   Ask it of every sentence, label, blurb, caption and link on a fiction
   surface, before it ships:

       Who says this, and where are they standing?

   Standing inside the world: it ships. Standing outside it: it does not ship
   HERE. It is not deleted, it is relocated (see /making).

   Three ways the answer comes back "outside", and all three have shipped:
     - The author.    "that was the prompting, not the model", "not a design
                      failure", "all ten renderings are drawn", "in this
                      series", "silence is permission". Every one concedes an
                      author on a page whose whole claim is that there isn't one.
     - The pipeline.  A </content> tag at the end of s3-09. A .md filename used
                      as link text. Anything a machine wrote that nobody said.
     - The critic.    A blurb that describes the work from beside it. If the
                      entry says "I", the blurb saying "he" has hired a
                      narrator who does not exist.

   A link is not a mention, it is a door: say where it opens. Link TEXT is not
   the test, the TARGET is. Those Sources opened on the working bibles, which
   are kill records, instructions to whoever writes next, and arc tables that
   spoiler-index every entry.

   The order of doors is one-way: the making-of links into the fiction. The
   fiction never links out to the making-of. Only the site chrome does.

   The rule this replaces was correct and was violated by the array beneath it.
   A comment is not a guard. Every clause above has a test named after it. */
```

Why this form: "who says this" is answerable in two seconds against a specific sentence, and it fires on all five audit findings without needing a vocabulary list. The vocabulary list is the guard's job, not the writer's.

## 2. Where the craft record lives

**A new surface, `/making`, "The Making", registered in `/Users/darkpandawarrior/Repos/Interview/cv-siddharth/src/data/surfaces.ts` in the `proof` group** alongside The Lab Bench and The Blueprint Room. It is a portfolio surface, not a lore surface. That is the whole ruling: the anthology is a thing the portfolio contains, so the portfolio's frame is allowed to have an author and the anthology's pages are not.

What it holds, and it should hold all of it plainly: the blind cross-lab ownership audit and the six premises it killed, the portrait iterations and what was wrong with them, the voice constraints, the generator pipeline, the retroaction-discovery standard from `interloop.md` ("found in shipped text or they are retcons and are cut"). Kill records are impressive evidence on a surface about the making and derivative-sounding inventory on a surface about the world. Same table, different room.

How it is reached, in order of how a real visitor arrives:

- **The surface wall, the command palette, `/hire`, `/loopdown`.** The same three doors every other proof surface already has, for free, by being in the registry. This is the deliberate path: someone assessing the work goes looking for evidence and finds it where all the other evidence is.
- **`SiteFooter`, one link, present on fiction pages too.** The footer is already outside the fiction: it carries his name. A reader who wants the making-of can always reach it from any lore page, but only by leaving the page's content and dropping into the chrome that has always admitted an author. That is the difference between reaching it and falling into it.
- **Nowhere else.** No link from `/canon`'s body, no link from an entry, no "read how this was made" card under a plate, no season landing, no blurb, no caption.

Two conditions on the surface itself: it sits behind the same declared-season spoiler gate `/canon` already implements, because a kill record spoils; and it is the one surface allowed to link at `.md` working files, which is exactly why the guards below scope the link ban to fiction surfaces rather than the whole site.

## 3. The mechanical guards

First, what already works and should be copied rather than re-derived. `canonLore.test.ts`'s export walk is the right shape. And `read.$slug.tsx` (lines 88 to 129) already refuses to derive an og description from body prose and fingerprints the blurb against the opening line, so the "whoever fixes the truncation deletes #2300's ending" risk from `interloop.md` is genuinely covered. The gap is everywhere the generated corpus goes.

**Guard A. Residue in the published prose. Nothing guards this today, and it is live right now.** `/Users/darkpandawarrior/Repos/Interview/cv-siddharth/src/data/anthology.ts` line 1042 still ends s3-09's body with `\n</content>`, even though the source file `/Users/darkpandawarrior/Repos/Writing/the-loopdown/fiction/morkinstar-journals/s3-09-the-only-page-i-did-not-write-alone.md` is now clean. The source was fixed and the generated artifact was never regenerated, which is the exact reason the guard must run on the output, not the input. `anthology.test.ts` already tests bodies for an H1 and for leftover frontmatter, so the class is understood there; it just never learned this member of it. Add to that file:

```ts
const RESIDUE = /<\/?(content|document|response|thinking|antml[^>]*)>|^```\s*$|^---\s*$/m;
```
checked against every `body`, plus a plain `body.trimEnd()` assertion that no body's last line is a tag. Same test file, same walk, three lines.

**Guard B. Process vocabulary over the generated corpus, not just the hand-written module.** The `BANNED` array in `canonLore.test.ts` only sees `canonLore.ts`'s exports. Every string in `anthology.ts` (34 bodies, 34 blurbs, season blurbs, witness `did` lines, plate captions) is equally reader-visible and unguarded. Move `BANNED` and `walk()` into one shared file and import it from both test files. Do not copy the array; a second copy is how the two drift and the weaker one becomes the one people edit.

**Guard C. The blurb person check, which is the only new logic.** No guard exists and a regex cannot judge voice, but it can judge person, and person is precisely what broke. The rule is mechanical: if the entry's body speaks in the first person, its blurb must too.

```ts
const firstPerson = (b: string) => /\bmy dear readers\b|(^|\s)I\s/.test(b);
// red today on s3-01, s3-03, s3-05, s3-07, s3-09, s3-11, s3-12
```
It goes red on landing, on roughly seven Season Three blurbs written as "He burns it faster than he can explain why he wrote it". That is a feature: per the harness's own green-build rule, a guard that has never been observed to fire has not been proven to work, and this one proves itself the moment it is added. Fix the blurbs at source in the `.md` frontmatter, regenerate, watch it go green.

**Guard D. Coverage assertion on every walker.** This is the guard against the failure mode you actually named. Each walking test asserts a floor on what it visited (`expect(walked.length).toBeGreaterThan(400)`). Without it, someone renames an export, moves prose into a file the walker does not import, or wraps a value in a type the walker skips, and the test stays green while inspecting nothing. Four times this project has encoded an intention and executed it into nothing; three of those are only detectable as a guard that quietly stopped reading.

**Guard E. Link targets on fiction surfaces.** One test that scans `canon.tsx`, `anthology.tsx`, `read.$slug.tsx` and the fiction data modules for `href`/`to` values matching `/\.md\b/`, `github\.com/.+/fiction/`, or a path outside the reader-facing route set, and separately asserts that none of them contains the string `/making`. Both directions of the one-way door in one file. `/making` itself is exempt by path, which is the only exemption.

**Guard F. Upstream, where the prose is actually written.** `/Users/darkpandawarrior/Repos/Writing/the-loopdown/scripts/lint-voice.mjs` takes a single lesson dir or file and is never run over `fiction/**`, so no published entry has ever been linted for anything. Two changes: teach it to accept a directory of `.md` files generally, and add the residue patterns from Guard A to its `HARD` list. Then wire `node scripts/lint-voice.mjs fiction/morkinstar-journals` into the same gate that runs before publishing. The site-side tests stay as the backstop, because the two repos drift by construction and s3-09 is the proof: fixing the prose upstream did not fix what shipped.

Ordering, if only some of it gets done: A and F first, because a machine tag has been sitting in published fiction since Season Three landed. Then D, because every guard here is worth exactly what its coverage assertion says it is.