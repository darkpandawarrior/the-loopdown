# Decisions log

Settled choices for this repo, one line each, so a new session does not re-open them. Read before proposing an architectural change, and append a line when a decision is made.

- 2026-07-19: One lesson.md is the source of truth and every channel post is an adaptation of it, not a rewrite. Why: write once and adapt many keeps the voice consistent, and voice-profile.md is checked on every draft. (source: docs/DESIGN.md)
- 2026-07-19: LinkedIn is never auto-posted. Posts are exported to Buffer or pasted and a human clicks publish, and dev.to and Hashnode publishes need explicit per-post approval. Why: publishing public content on the owner's accounts must always be a human action. (source: docs/DESIGN.md Publishing and Non-goals)
- 2026-07-19: The system stays Markdown, git and a rasterizer, with no CMS, database or web app, and one npm dependency (@resvg/resvg-js). Why: tooling must stay verifiable and minimal, with no service required to author a post. (source: docs/DESIGN.md Principles and Non-goals)
- 2026-07-20: The pipeline is free-only. dev.to auto-publishes, and LinkedIn, Medium and Hashnode go through free paste or import, with Hashnode written to out/hashnode.md. Why: the Hashnode API was Pro-gated and the pipeline should not need paid keys. (source: f4ebc83)
- 2026-07-20: The dev.to export is idempotent, tracking the article id in state.json and adopting an existing article by title. Why: --draft followed by --publish created a duplicate and dev.to returned a 422 for the reused title. (source: 79d94cb)
- 2026-08-29: A Hashnode export failure is reported as a deliberate paywall, not an outage or a bad token, and it logs and continues so it never blocks dev.to. Why: Hashnode retired free GraphQL API access on 2026-05-13, and a confident wrong diagnosis sends the reader to fix the wrong thing. (source: aae9751)
- 2026-09-07: AI-generated hero images are rejected, not deferred, and each lesson's own carousel art is placed in the article body instead. Why: that art already exists and is on-brand, and generated decorative art would cost money to make the piece worse. (source: docs/DESIGN.md, 4c12b82)
