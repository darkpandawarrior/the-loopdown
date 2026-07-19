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

---

<!-- REGISTRY:START -->
### 📡 Lessons (dev content)

| Date | Title | Pillar | Series | Status |
|------|-------|--------|--------|--------|
| 2026-07-19 | [Teaching a phone to disbelieve its own GPS](lessons/2026-07-19-mileway-dead-reckoning/lesson.md) | location | sensors-who-lie | ready |

### 🎭 Cast appearances (continuity)

| Character | Appearances | In |
|-----------|-------------|----|
| `the-concussed-witness` | 1 | [Teaching a phone to disbelieve its own GPS](lessons/2026-07-19-mileway-dead-reckoning/lesson.md) |

### 📚 Archive (10 pieces)

| Title | Form | Era | Words | Tags |
|-------|------|-----|-------|------|
| [Chronicles Of An NRE Kid](archive/chronicles-of-an-nre-kid.md) | essay | personal-essay | 1966 | `memoir` `identity` `growing-up` |
| [College Clubs: Why Aren't You In Any?](archive/college-clubs.md) | opinion | opinion | 363 | `opinion` `college` `soft-skills` |
| [CTC: Cost To Company](archive/ctc-cost-to-company.md) | short-fiction | 2069 (written 2020) | 1628 | `dystopia` `satire` `world-building` `corporate` |
| [Deadline](archive/deadline.md) | short-fiction | 2018 | 3164 | `memento-mori` `sci-fi` `diary` `philosophy` |
| [Honest College Fests](archive/honest-college-fests.md) | humor | humor | 978 | `satire` `college` `listicle` |
| [It's A Doggone Life](archive/its-a-doggone-life.md) | essay | personal-essay | 1371 | `memoir` `dogs` `heart` |
| [Pointer Games](archive/pointer-games.md) | short-fiction | campus-lore | 1739 | `campus-lore` `mystery` `hinglish` `world-building` |
| [Prophecy #201112003](archive/prophecy-201112003.md) | short-fiction | campus-lore | 1761 | `campus-lore` `mystery` `world-building` |
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
| `lore/` | The universe — [bible](lore/bible.md), [cast](lore/cast.md), [series](lore/series.md). |
| `series/` | Generated bingeable hub page per arc (cross-post "read the series" target). |
| `profile.yaml` | Cross-platform identity — handles + canonical strategy; threads into every footer. |
| `lessons/<date>-<slug>/` | One folder per lesson: source + per-channel adapts + assets + metrics. |
| `templates/svg/` | Branded graphic templates (dark dev aesthetic). |
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
