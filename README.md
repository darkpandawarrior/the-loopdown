# The Loopdown

> *loop* + *lowdown* — field notes from an engineer who writes.

Short, sharp technical lessons pulled from real projects (Mileway, kmp-toolkit,
PaymentsLab, Kursi, Dice), each written once and adapted to LinkedIn, dev.to,
Hashnode, and Medium — plus an archive of everything I've written before.

This repo does three jobs at once:

1. **📚 Archive** — my complete writing corpus, consolidated and versioned. Nothing lost.
2. **📡 Engine** — a pipeline that turns a project war-story into a multi-channel post + branded graphic.
3. **🧱 Wall** — public proof of consistency. The registry below *is* the track record.

## The universe

The Loopdown isn't a content calendar — it's a *world*. An engineer stuck in a time loop
(52 iterations of the same Wednesday), filing field notes on the same bugs and lying
systems each pass. Because **seniority is the loop**: you don't know more code, you've
just run the same failure enough times to name it on sight.

Posts share a recurring cast — [The Concussed Witness](lore/cast.md) (GPS that lies with
total confidence), [Doze the Jailer](lore/cast.md), [The Messenger](lore/cast.md)
(CancellationException, forever mistaken for an assassin) — grouped into
[series](lore/series.md) you can binge. Continuity is tracked automatically (see Cast
Appearances below). The world is in [`lore/`](lore/bible.md); the voice is in
[`voice/`](voice/voice-profile.md).

## 🔭 The Morkinstar Journals — the fiction anthology

Separate universe, same author. **[Two seasons, twenty entries](fiction/morkinstar-journals/README.md)**,
grown out of a single 2021 story in the archive that turned out to have a whole series folded
inside it.

> A field correspondent visits worlds that cannot yet leave them and writes down the story each
> one tells about its own weather. Every world independently reports fourteen gods and fourteen
> monsters. Nobody anywhere can name the fourteenth.

- **[Read it in the browser →](fiction/morkinstar-journals/site.html)** (one self-contained file,
  both seasons, every plate)
- Canon: [S1 bible](fiction/morkinstar-journals/bible.md) · [S2 bible](fiction/morkinstar-journals/s2-bible.md)
- Both seasons were audited by multi-lens councils plus cross-family ensembles:
  [S1](fiction/morkinstar-journals/council-2026-08-15.md) ·
  [S2 ownership audit](fiction/morkinstar-journals/council-s2-2026-08-15.md)

```bash
node scripts/morkinstar-plates.mjs   # 21 field plates, both seasons
node scripts/morkinstar-site.mjs     # → site.html
```

This is **not** The Loopdown's cosmology and does not cross over with the cast above. They rhyme.
The rhyme is the reward.

---

<!-- REGISTRY:START -->
### 📡 Lessons (dev content)

| Date | Title | Series | Status | Live |
|------|-------|--------|--------|------|
| 2026-09-02 | [The captain routes. The captain never rows.](lessons/2026-09-02-the-captain-never-rows/lesson.md) | notes-from-the-loop | 🟡 ready | — |
| 2026-08-31 | [I audited my own migrations. It was not fine.](lessons/2026-08-31-the-ferryman-rows-one-way/lesson.md) | crossing-the-schema | 🟡 ready | — |
| 2026-08-29 | [Plausible is worse than wrong](lessons/2026-08-29-the-borrowed-hand/lesson.md) | notes-from-the-loop | 🟡 ready | — |
| 2026-08-27 | [Your thresholds do not belong in constants](lessons/2026-08-27-thresholds-in-config/lesson.md) | chain-of-custody | 🟡 ready | — |
| 2026-08-25 | [Invariants are cheap. Silent corruption is not.](lessons/2026-08-25-invariants-are-cheap/lesson.md) | chain-of-custody | 🟡 ready | — |
| 2026-08-20 | [Every filter needs a documented exception](lessons/2026-08-20-documented-exception/lesson.md) | sensors-who-lie | 🟡 ready | — |
| 2026-08-18 | [Never silently change a number someone gets paid on](lessons/2026-08-18-never-silently-change-a-number/lesson.md) | chain-of-custody | 🟡 ready | — |
| 2026-08-13 | [When two sensors disagree, rank them](lessons/2026-08-13-accelerometer-outranks-gps/lesson.md) | sensors-who-lie | 🟡 ready | — |
| 2026-08-11 | [Your data model is where uncertainty goes to die](lessons/2026-08-11-uncertainty-dies-in-data-model/lesson.md) | chain-of-custody | 🟡 ready | — |
| 2026-08-06 | [One global threshold is how you delete valid data](lessons/2026-08-06-one-global-threshold/lesson.md) | sensors-who-lie | 🟡 ready | — |
| 2026-08-04 | [Filtered should never mean deleted](lessons/2026-08-04-filtered-never-deleted/lesson.md) | sensors-who-lie | 🟡 ready | — |
| 2026-07-31 | [collectAsState is quietly leaking your work](lessons/2026-07-31-collectasstate-leak/lesson.md) | ghosts-in-the-recomposition | 🟡 ready | — |
| 2026-07-29 | [expect/actual is the wrong default in KMP](lessons/2026-07-29-kmp-expect-actual-default/lesson.md) | one-brain-two-bodies | 🟡 ready | — |
| 2026-07-24 | [Your LazyColumn recomposes on every scroll](lessons/2026-07-24-lazycolumn-recomposition/lesson.md) | ghosts-in-the-recomposition | 🟡 ready | — |
| 2026-07-22 | [The 5-second window that crashes your service](lessons/2026-07-22-foreground-service-five-seconds/lesson.md) | the-night-shift | 🟡 ready | — |
| 2026-07-20 | [CancellationException is not an assassin](lessons/2026-07-20-coroutine-cancellation-messenger/lesson.md) | the-coroutine-court | 🟡 ready | — |
| 2026-07-19 | [Teaching a phone to disbelieve its own GPS](lessons/2026-07-19-mileway-dead-reckoning/lesson.md) | sensors-who-lie | 🟢 live | [read →](https://dev.to/darkpandawarrior/teaching-a-phone-to-disbelieve-its-own-gps-cip) |

### 🎭 Cast appearances (continuity)

| Character | Appearances | In |
|-----------|-------------|----|
| `the-concussed-witness` | 5 | [Every filter needs a documented exception](lessons/2026-08-20-documented-exception/lesson.md), [When two sensors disagree, rank them](lessons/2026-08-13-accelerometer-outranks-gps/lesson.md), [One global threshold is how you delete valid data](lessons/2026-08-06-one-global-threshold/lesson.md), [Filtered should never mean deleted](lessons/2026-08-04-filtered-never-deleted/lesson.md), [Teaching a phone to disbelieve its own GPS](lessons/2026-07-19-mileway-dead-reckoning/lesson.md) |
| `the-archivist` | 4 | [Your thresholds do not belong in constants](lessons/2026-08-27-thresholds-in-config/lesson.md), [Invariants are cheap. Silent corruption is not.](lessons/2026-08-25-invariants-are-cheap/lesson.md), [Never silently change a number someone gets paid on](lessons/2026-08-18-never-silently-change-a-number/lesson.md), [Your data model is where uncertainty goes to die](lessons/2026-08-11-uncertainty-dies-in-data-model/lesson.md) |
| `the-recomposer` | 2 | [collectAsState is quietly leaking your work](lessons/2026-07-31-collectasstate-leak/lesson.md), [Your LazyColumn recomposes on every scroll](lessons/2026-07-24-lazycolumn-recomposition/lesson.md) |
| `the-fleet` | 1 | [The captain routes. The captain never rows.](lessons/2026-09-02-the-captain-never-rows/lesson.md) |
| `the-ferryman` | 1 | [I audited my own migrations. It was not fine.](lessons/2026-08-31-the-ferryman-rows-one-way/lesson.md) |
| `the-borrowed-hand` | 1 | [Plausible is worse than wrong](lessons/2026-08-29-the-borrowed-hand/lesson.md) |
| `the-second-witness` | 1 | [When two sensors disagree, rank them](lessons/2026-08-13-accelerometer-outranks-gps/lesson.md) |
| `the-understudy` | 1 | [expect/actual is the wrong default in KMP](lessons/2026-07-29-kmp-expect-actual-default/lesson.md) |
| `doze-the-jailer` | 1 | [The 5-second window that crashes your service](lessons/2026-07-22-foreground-service-five-seconds/lesson.md) |
| `the-messenger` | 1 | [CancellationException is not an assassin](lessons/2026-07-20-coroutine-cancellation-messenger/lesson.md) |

### 📚 Archive (10 pieces)

| Title | Form | Era | Words | Tags |
|-------|------|-----|-------|------|
| [Chronicles Of An NRE Kid](archive/chronicles-of-an-nre-kid.md) | essay | personal-essay | 1966 | `memoir` `identity` `growing-up` |
| [CTC: Cost To Company](archive/ctc-cost-to-company.md) | short-fiction | 2069 (written 2020) | 1628 | `dystopia` `satire` `world-building` `corporate` |
| [Deadline](archive/deadline.md) | short-fiction | 2018 | 3164 | `memento-mori` `sci-fi` `diary` `philosophy` |
| [Honest College Fests](archive/honest-college-fests.md) | humor | humor | 978 | `satire` `college` `listicle` |
| [It's A Doggone Life](archive/its-a-doggone-life.md) | essay | personal-essay | 1371 | `memoir` `dogs` `heart` |
| [Pointer Games](archive/pointer-games.md) | short-fiction | campus-lore | 1739 | `campus-lore` `mystery` `hinglish` `world-building` |
| [Prophecy #201112003](archive/prophecy-201112003.md) | short-fiction | campus-lore | 1761 | `campus-lore` `mystery` `world-building` |
| [The Legend Of K'öæluæ's Scales](archive/legend-of-koaeluae-scales.md) | short-fiction | 2021 | 1804 | `world-building` `mythology` `sci-fi` `framed-narrative` |
| [The Loopdown](archive/the-loopdown-story.md) | short-fiction | 2020 | 1973 | `time-loop` `sci-fi` `world-building` `diary` |
| [The Pun Force](archive/the-pun-force.md) | humor | humor | 627 | `puns` `meta` `comedy` `world-building` |
<!-- REGISTRY:END -->

---

## How it works

```
idea  →  new-lesson.mjs  →  lesson.md (source of truth, written ONCE)
                                 │
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
           linkedin.md      article.md      assets/card.yaml
        (≤1300, punchy)   (long-form)      → render.mjs → card.png
                 │               │               │
                 └──────── you review ───────────┘
                                 │
                    export → Buffer (LinkedIn) · dev.to/Hashnode API · Medium (manual)
                                 │
                          meta.yaml logs urls + metrics
                                 │
                    build-registry.mjs → this README updates
```

Every draft is checked against [`voice/voice-profile.md`](voice/voice-profile.md) —
the style contract distilled from the archive so new posts sound like *me*, not
generic LinkedIn.

## Commands

```bash
cd scripts && npm install          # once (pulls @resvg/resvg-js for SVG→PNG)

node new-lesson.mjs "dead reckoning" --pillar location --project Mileway --date 2026-07-19
node render.mjs lessons/2026-07-19-dead-reckoning      # card.yaml → card.png
node build-registry.mjs                                 # regenerate registry + this README
node check-setup.mjs                                    # pipeline readiness dashboard
node export.mjs lessons/<dir>                           # dry-run: plan + paste files (safe)
node export.mjs lessons/<dir> --draft                   # dev.to drafts, reviewable on-platform
```

Accounts, tokens, and the publish flow: **[SETUP.md](SETUP.md)**.

## Repo map

| Path | What |
|------|------|
| `archive/` | Existing writing, converted to clean Markdown + frontmatter. |
| `voice/voice-profile.md` | The style contract every post is checked against. |
| `lore/` | The universe: [bible](lore/bible.md), [cast](lore/cast.md), [pantheon](lore/pantheon.md), [series](lore/series.md). |
| `lore/bestiary.md` · `docs/bestiary.png` | **Generated.** Every entity, its sigil, its dead Aspect, and every post it has appeared in. Rebuilds with the registry. |
| `series/` | Generated bingeable hub page per arc (cross-post "read the series" target). |
| `profile.yaml` | Cross-platform identity — handles + canonical strategy; threads into every footer. |
| `lessons/<date>-<slug>/` | One folder per lesson: source + per-channel adapts + assets + metrics. |
| `scripts/design-kit.mjs` | The visual identity: textures, diagram figures, and the **cast drawn as specimen plates**. |
| `scripts/slide-css.mjs` | Carousel stylesheet. Slides are HTML, screenshotted through Chromium, so body copy wraps itself. |
| `templates/copy/` | Hook formulas + per-channel skeletons. |
| `scripts/` | `new-lesson` · `render` · `build-registry` · `check-setup` · `export`. |
| `data/backlog.md` | Idea queue mined from projects. |
| `data/registry.json` | Machine-readable source of truth (generated). |
| `docs/DESIGN.md` · `SETUP.md` | Why it's built this way · how to wire the accounts. |
| `.env` | **Gitignored.** Your API tokens. Copy from `.env.example`. |
| `private/` | **Gitignored.** Personal/admin docs + original binaries. Never pushed. |

## Voice, in one line

> Hook you with a scene, teach you something real, land a payload you didn't see
> coming — while clearly having fun. See [`voice/voice-profile.md`](voice/voice-profile.md).

## Publishing — one connected campaign, not four copies

Each lesson goes out as a *coordinated cross-platform drop* ([SETUP.md](SETUP.md)):

- **dev.to + Hashnode + Medium** → native APIs (draft-first, per-post approval). Medium
  uses the legacy token if your account has one, else a one-click import from the canonical URL.
- **LinkedIn** → paste-ready file with the full-write-up link auto-embedded (optional Buffer queue). No tool touches the account directly.
- **One canonical home** so cross-posts don't compete in search — the rest declare `canonical → it`.
- **Consistent branded footer** on every article: series, featured cast, "previously in this
  series," follow links — all generated from [`profile.yaml`](profile.yaml). Edit once, threads everywhere.
- **Series hubs** ([`series/`](series/)) — a bingeable index page per arc, linked from every post in it.

## Roadmap

- [x] Repo + archive + voice profile + visual engine + first lesson
- [x] Lore layer — universe bible, cast, series, continuity index
- [x] `export.mjs` — dev.to/Hashnode/Buffer + paste files; `check-setup.mjs` dashboard
- [ ] Fill `.env` tokens ([SETUP.md](SETUP.md)) + push to GitHub
- [ ] GitHub Action — auto-render assets + rebuild registry on push
- [ ] AI hero-image hook for flagship/story posts
- [ ] Cadence: 2–3 posts/week from the backlog
