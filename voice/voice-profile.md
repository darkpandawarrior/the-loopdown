---
title: Voice Profile — Siddharth Pandalai
type: reference
status: living
updated: 2026-07-19
sources: [archive/*.md]
---

# Voice Profile

The style contract. **Every draft in `lessons/` gets checked against this before it ships.**
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
- **Banned phrases** (the linter flags them): *here's the thing, at the end of the day,
  when it comes to, in today's world, let's dive in, delve, game-changer, testament to,
  underscores, in the realm of, needless to say, it's worth noting, that said, seamless,
  robust solution, leverage (as a verb), unlock, elevate, supercharge, navigate the
  landscape, the fact that, in conclusion, moreover, furthermore.*
- **Vary your sentences.** Real writing has lumpy rhythm: a three-word line, then a long
  winding one, then a fragment. Uniform medium-length sentences read like a machine.
- **Don't over-list.** Not every idea needs a tidy rule-of-three. Sometimes it's two
  things. Sometimes it's a mess you admit is a mess.
- **First person, specific, a little rough.** Name the day the bug happened. Quote the
  actual message. Admit what you got wrong. A real detail beats a smooth generalization.
- **One joke or aside per post, minimum.** Your archive is funny. Let it be.

Run `node scripts/lint-voice.mjs lessons/<dir>` before shipping. Zero flags or it doesn't go out.

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
