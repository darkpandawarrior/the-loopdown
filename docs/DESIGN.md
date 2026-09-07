# Design — The Loopdown content engine

*Spec of record. 2026-07-19.*

## Goal
A repeatable engine that turns real engineering work into short, high-signal,
unmistakably-personal content across LinkedIn / dev.to / Hashnode / Medium — to grow
reach and strengthen a Lead-track job search — while consolidating all past writing
in one tracked home. Target cadence: 2–3 posts/week.

## Principles
- **Write once, adapt many.** One `lesson.md` is the source of truth; channels are adaptations, not rewrites.
- **Voice is a contract, not a vibe.** `voice-profile.md` is checked on every draft (distilled from the archive).
- **Full ownership / nothing lost.** Every piece — past and future — is cataloged in `registry.json` and backed up; originals preserved in gitignored `private/originals`.
- **Public/private split by default.** Creative work is public (portfolio value); personal/admin docs are gitignored. Mirrors the author's `DATA_CONTRACT` pattern.
- **Verifiable, minimal tooling.** Node-only, one dependency (`@resvg/resvg-js`). No service required to author a post.

## Architecture
- `lessons/<date>-<slug>/` — self-contained unit: `lesson.md` (truth), `linkedin.md`, `article.md`, `meta.yaml` (tracking), `assets/` (card.yaml → card.svg/png).
- `archive/*.md` — existing corpus with frontmatter; same schema shape so one registry covers both.
- `scripts/` — three tools, each one job: scaffold (`new-lesson`), render (`render`), index (`build-registry`).
- `templates/svg/` — placeholder-driven SVG; `render.mjs` fills `{{FIELD}}` / `{{FIELD_n}}` from `card.yaml` and rasterizes to 1200×1200 PNG.
- `data/registry.json` + README tables — generated single source of truth.

## Data flow
idea → `new-lesson` → author `lesson.md` → adapt `linkedin.md`/`article.md` (vs voice profile) → fill `card.yaml` → `render` → **human review** → export → log `meta.yaml` → `build-registry` updates README.

## Publishing (safety)
- LinkedIn: exported to Buffer, human clicks publish. No automation touches the account.
- dev.to/Hashnode: native APIs, per-post approval (a "publish public content" action — always explicit).
- Medium: manual paste.

## Tracking schema (`meta.yaml`)
Per channel: `{status, url, scheduled, published, <engagement counters>}`. Rolls into `registry.json`.

## Shipped since this spec
- `export.mjs` to dev.to/Hashnode: built. Six lessons are live across dev.to, LinkedIn, Medium
  and Hashnode.
- GitHub Action for auto-render/registry: built. `.github/workflows/pipeline.yml` lints voice,
  smoke-tests renders, and fails the build when the registry or README drift from source.

## Deliberately not built
- AI hero images: rejected, not deferred. `scripts/figures.mjs` places each lesson's own
  carousel art in the article body instead. That art already exists, is on-brand, and generated
  decorative art would cost money to make the piece worse (see the file's own header comment).

## Non-goals
- No CMS, no DB, no web app. Markdown + git + a rasterizer is the whole system.
- No auto-posting to LinkedIn. Ever. Human in the loop by design.
