---
title: Voice Profile — Siddharth Pandalai
type: reference
status: living
updated: 2026-09-02
sources: [archive/*.md, private/originals/*.docx, lessons/**, sent mail, AgentHarness/skills/writing-for-humans/VOICE-MEASURED.md]
---

# Voice Profile

The style contract. **Every draft in `lessons/` gets checked against this before it ships.**

> **Measured 2026-09-02, and the measurement changed it.** The numbers behind every rule below now
> live in `AgentHarness/skills/writing-for-humans/VOICE-MEASURED.md` (gate one: six surfaces,
> 250,000 words, re-runnable with `scripts/voice-measure.py`). Read it before editing a rule here.
> The short version: this file's four core rules are correct and were being obeyed nowhere. Against
> the 2011-21 archive, the shipped lessons run contractions 23.19 -> 1.89 per 1k, first person
> 20.23 -> 4.09, questions 8.70 -> 1.48, hedging 8.28 -> 2.53. Direct address is the exception and
> went UP, 11.89 -> 14.48. `lint-voice.mjs` reported clean throughout, because it was checking
> dashes and phrases, which is the mechanical tier and the half that matters least.

Distilled from the archive (magazine fiction, essays, humor) and tuned for the new job:
technical LinkedIn / dev.to / Hashnode / Medium content that still sounds unmistakably like Siddharth.

## The one-line identity

> An engineer who writes like a storyteller — hooks you with a scene, teaches you something real, and lands a payload you didn't see coming, all while clearly having fun.

## Voice DNA (the non-negotiables)

1. **Open on a hook, never a preamble.** First line grabs a collar.
   - From the archive: *"Would you want to know you're going to die beforehand?"* · *"Puns. The building block of humor."*
   - Translated to tech: *"Our GPS thought a user in a tunnel was doing 400 km/h. Here's how we taught the phone to disbelieve its own sensors."*
2. **Wordplay is load-bearing, not decoration.** Puns, double meanings, a title that works on two levels. (`The Loopdown` = a loop + the lowdown.)
3. **Break the fourth wall.** Talk *to* the reader. "You've hit this bug. I know you have." Rhetorical questions. Direct address.
4. **The joke lives in the (aside).** Parentheticals carry the wit — a running self-aware commentary track under the main line. This is the signature move; keep it.
5. **Stage the concept, don't just explain it.** Personify the abstract. Give it a world. Dead reckoning becomes "the phone dead-reckoning like a sailor with no stars." A race condition becomes two coroutines arguing over the last cookie.
6. **Payload under play.** The jokes are the wrapper; underneath is a genuine insight, a hard-won lesson, or a bit of real reflection. *Deadline* is a mortality meditation in a Deadpool costume. The tech version: the laugh gets them in, the lesson makes them save the post.
7. **Hinglish for punch, used sparingly.** *"Arrey bhai."* *"Aage kya karoge?"* One well-placed switch grounds it and reads human. Don't overdo it — seasoning, not the meal.
8. **Concrete specifics sell the bit.** Real numbers, real dates, "Day 154", exact figures. 50% → 95%. 738k LOC. Specificity = credibility + texture.
9. **World-building / lore is a welcome tool.** (Explicitly loved.) A recurring cast, a running mythology across posts, named "characters" for recurring bugs or patterns. A universe readers return to.

## Rhythm

Short. Punchy. Fragments for emphasis. **Then one longer, flowing sentence that breathes and carries a full thought before snapping back to something short.** Em-dashes — like this — and ellipses... everywhere. Whitespace is a tool; let lines land alone.

## Register dial (the new context)

The archive is loose, long, and very jokey (college magazine energy). LinkedIn needs the **same soul, tighter body**:

- Keep: hooks, wordplay, reader-address, payload-under-play, specifics, warmth.
- Tighten: length, tangent count, in-jokes that need context.
- Add: a clear, credible engineering takeaway per post. You're writing for a hiring manager AND the feed. Both should nod.
- The blend you chose: **sharp senior engineer × playful teacher.** Authority you can trust, delivered by someone you'd actually want on your team.

## Structural habits worth reusing

- **Bookend / callback.** *CTC* opens and closes on "couldn't believe his eyes." Open a post on a symptom, close on the same symptom now understood.
- **Diary / timestamped beats.** *Deadline* and *The Loopdown* use "Day N". Great for build-in-public: "Commit 1… Commit 40… what I'd tell commit-1 me."
- **The reveal.** Withhold the mechanism, describe the mystery, then drop the how.

## Sound human, not generated (HARD RULES — enforced by `scripts/lint-voice.mjs`)

The whole point is that this reads like a person wrote it. These are non-negotiable:

- **No em dashes. Ever.** Not `—`, not `–`. Use a full stop, a comma, a colon, or
  parentheses. Two short sentences beat one em-dash sentence. For number ranges use
  "30 to 40" or "30-40" (a plain hyphen), never `30–40`.
- **Kill the "It's not X, it's Y" reflex.** The hollow rhetorical flip is the loudest AI
  tell there is. If you reframe (and you should), make it a vivid image, not a negation.
  "Think of GPS as a witness with a concussion" is fine. "GPS isn't a sensor, it's a
  liability" is a tell.
- **Banned phrases.** The linter carries the full list, which is cheap to keep and catches drift
  that has not happened yet. **The six that have actually appeared in his writing** are the ones
  worth holding in your head while drafting: *the fact that* (17 hits), *unlock* (11), *moreover*
  (7), *that said* (3), *at the end of the day* (2), *when it comes to* (1). The other 17 have
  never fired in 250,000 words. Do not grow the list from a blog post; grow it when a real
  sentence goes wrong. Every reserved term strands its general class, and the fiction needs
  words like *realm* (9 hits there) that a generic slop list would take away.
- **Vary your sentences.** Real writing has lumpy rhythm: a three-word line, then a long
  winding one, then a fragment. Uniform medium-length sentences read like a machine.
- **Don't over-list.** Not every idea needs a tidy rule-of-three. Sometimes it's two
  things. Sometimes it's a mess you admit is a mess.
- **First person, specific, a little rough.** Name the day the bug happened. Quote the
  actual message. Admit what you got wrong. A real detail beats a smooth generalization.
- **One joke or aside per post, minimum.** Your archive is funny. Let it be.

Run `node scripts/lint-voice.mjs lessons/<dir>` before shipping. Zero flags or it doesn't go out.

**A clean run certifies the mechanical tier only** — dashes, banned phrases, pipeline residue. It
also prints a VOICE FLOOR advisory when a draft has no contractions, no "I", no hedging and no
asides at all (six lessons currently do). That advisory never blocks, because whether a sentence
needs a contraction is a judgment no script can make. Read it and decide.

## The four signals to protect, ranked by measured evidence

1. **The parenthetical aside** — the signature move. Survived the tech transition nearly intact
   (2.90 -> 2.39 per 1k) and peaks in his email at 7.45. Never edit one out.
2. **Direct address** — the only signal that ROSE (11.89 -> 14.48). It is already working.
3. **Contractions** — the biggest loss, -92%. Asserted in four documents for a year, obeyed in
   none of them. Half the lessons contain zero.
4. **Honest hedging** — *I think*, *probably*, *not sure*. Down 69%, and half the lesson files
   have none. Uncertainty is information; flattening it out is what makes writing sound generated.

## Hard limits (don't cross)

- Never punch down; the humor is warm, self-deprecating, never mean.
- No manufactured outrage / cynical "unpopular opinion" bait — it reads junior and it isn't you.
- Don't fake vulnerability for engagement. The reflection in *Deadline* works because it's real. Keep that bar.
- Credibility first: never oversell a result or claim expertise you can't defend in an interview. The metrics are real; keep them real.

## The 6-point ship checklist (run before every post)

- [ ] Does line 1 make someone stop scrolling?
- [ ] Is there at least one bit of real wordplay or a parenthetical that made *me* smile?
- [ ] Is there a concrete, defensible engineering takeaway?
- [ ] Is there a payload under the play — something they'll remember or feel?
- [ ] Does it sound like the archive, not like generic LinkedIn?
- [ ] Would a hiring manager AND a scrolling dev both nod?
