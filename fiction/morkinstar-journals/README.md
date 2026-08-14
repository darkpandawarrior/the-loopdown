---
title: The Morkinstar Journals
type: index
status: living
created: 2026-08-15
seasons: 2
---

# The Morkinstar Journals

![The Morkinstar Journals](assets/00-series-cover.png)

> Fourteen gods. Fourteen monsters. Thirteen names.
> Nobody will tell me the fourteenth.

Twenty entries from the field notebooks of **Lu'kifær Morkinstar**, correspondent for the
Galactic Directory, who visits worlds that cannot yet leave them and writes down the story
each one tells about its own weather.

Entry #2245 was written in 2021 and lives in [`archive/`](../../archive/legend-of-koaeluae-scales.md).
It had the whole frame in it and did not know it was a series yet. The other nineteen grew out of it.

**Read it in the browser:** [`site.html`](site.html) — every entry, both seasons, with plates.
Rebuild with `node scripts/morkinstar-site.mjs`.

---

## Season One · The Directory

He files. Ten entries, each a world's legend and the phenomenon it explains. Underneath, a
count he cannot explain, a hypothesis he is wrong about, and an institution that writes
everything down badly.

| # | Entry | World | System | The phenomenon |
|---|---|---|---|---|
| 01 | [The Legend Of K'öæluæ's Scales](../../archive/legend-of-koaeluae-scales.md) | Exxobar | Alpha Axmoiri | Why it snows |
| 02 | [The Ninety-Nine Names Of Silence](02-the-ninety-nine-names-of-silence.md) | Grïnjdarlay | Alpha Axmoiri | Why nobody speaks aloud |
| 03 | [The Tide That Owes](03-the-tide-that-owes.md) | Vædrun | Alpha Axmoiri | Why the sea leaves for nine days |
| 04 | [The Word Marltains Do Not Have](04-the-word-marltains-do-not-have.md) | Marlt | Brixby | Why they talk to nobody |
| 05 | [The Arm Shake](05-the-arm-shake.md) | Killuga Var | Killuga | Why they hug strangers for a count of eleven |
| 06 | [The Standing Dead](06-the-standing-dead.md) | Jötunheimr | Ymirsgald | Why the dead are buried upright |
| 07 | [The Kindling](07-the-kindling.md) | Cendre | Cendrewake | Why they burn every book they own |
| 08 | [Two Suns, One Shadow](08-two-suns-one-shadow.md) | Solvei | Dvær Binary | Why two stars cast one shadow |
| 09 | [The World With No Number](09-the-world-with-no-number.md) | *[unnamed]* | *[unassigned]* | None. That is the phenomenon. |
| 10 | [Why We Measure Time In Hells](10-why-we-measure-time-in-hells.md) | The Galactic Directory | — | Why every date is named after an afterlife |

Canon: [`bible.md`](bible.md). Audit: [`council-2026-08-15.md`](council-2026-08-15.md).

## Season Two · The Ninety-One Pages

He stops filing. Season One's finale left him with *"a wooden case to build and ninety-one
pages to start"*, each of which must contain something nobody has ever written down. He is now
looking for worlds sliding toward Concluded and trying to keep them open.

He has not noticed what he is building.

| # | Page | Title | Where | The turn |
|---|---|---|---|---|
| 01 | 1 | [The Second Chair](s2-01-the-second-chair.md) | The case | He has no good reason for ninety-one |
| 02 | 4 | [The Weather They Made Up](s2-02-the-weather-they-made-up.md) | Vœrhan | A fabricated myth works exactly as well |
| 03 | 9 | [The Cold Case Of All Fourteen](s2-03-the-cold-case-of-all-fourteen.md) | Dhurin | A civilisation that is one long investigation |
| 04 | 16 | [The Last Thing He Taught Them](s2-04-the-last-thing-he-taught-them.md) | Ilmarrow | Lesson 341 is a title with nothing under it |
| 05 | 23 | [What You Have Not Said Out Loud](s2-05-what-you-have-not-said-out-loud.md) | Threnn | He left, and it left with him |
| 06 | 30 | [The Weight Of The Case](s2-06-the-weight-of-the-case.md) | His ship | The arithmetic comes out wrong |
| 07 | 38 | [Six Worlds, Six Fences](s2-07-six-worlds-six-fences.md) | Six worlds | They are aimed at each other |
| 08 | 47 | [The One That Stayed Open](s2-08-the-one-that-stayed-open.md) | Kaunis | You may not inherit the answer |
| 09 | 58 | [Someone Has Been Reading](s2-09-someone-has-been-reading.md) | His ship | An archive of one author is a self-portrait |
| 10 | 91 | [The Back Of The Case](s2-10-the-back-of-the-case.md) | The case | Vænheim has a number now |

Canon: [`s2-bible.md`](s2-bible.md). Audit: [`council-s2-2026-08-15.md`](council-s2-2026-08-15.md).

Page numbers skip because the pages between exist and he did not show us. Eighty-one are still
blank when the season ends.

---

## The plates

Twenty-one images in [`assets/`](assets/), plus half-scale JPEGs in `assets/web/` that the site
inlines.

```bash
node scripts/morkinstar-plates.mjs          # all of both seasons + the cover
node scripts/morkinstar-plates.mjs 07       # one Season 1 plate
node scripts/morkinstar-plates.mjs s2-04    # one Season 2 plate
node scripts/morkinstar-site.mjs            # rebuild site.html
```

**Season One plates are the Directory's survey form**: dark ground, cold accent, corner ticks,
`ENTRY #NNNN` in tape amber. An institution producing immaculate documentation of things it
has not understood.

**Season Two plates are his own page**: warm paper, dark ink, a case-and-slot frame with
ninety-one notches and a marker at the one you are reading. The two seasons are meant to be
distinguishable as *objects* from across a room, because that is the premise.

Both obey the same rule for the middle: **draw the mechanism, not a mood.**

## Three things that look like mistakes and are not

1. **The milgalaxal conversion does not multiply out.** 2228 Hellheims is given as 2455 Earth
   years when a click is 2 Earth years. That error is inherited from the 2021 original and
   Entry #2300 is built on it. It is the last surviving measurement of a Concluded world.
   Never correct it.
2. **Entry #2300 ends mid-sentence.** It is filed incomplete on purpose. Never finish it.
3. **Season Two never uses the word "concluding".** Season One's sign-off was *"This is
   Lu'kifær Morkinstar concluding Journal Entry #NNNN."* He does not say it any more. That is
   the whole season.

## Provenance

Both seasons audited by multi-lens Claude councils plus cross-family ensembles via OpenRouter
(cross-lab.0474 and cross-lab.0420, measured). The Season 2 audit was an **ownership test**: ten premises sent
to seven labs with no context, asking them to name the source. Six were named by two or more
labs independently and were killed. What survived, what died, and the dissents are recorded in
the two council files.

This is not The Loopdown's cosmology. Different fiction, no crossover. They rhyme, and the
rhyme is the reward.
