# Posting calendar

Cadence, as of 2026-08-02, and now automated:

- **dev.to: every 2 days.** `com.loopdown.devto` runs daily at 09:30 and publishes the next
  queued lesson, enforcing the 2-day gap itself against `data/publish.log`. It gates on the
  voice linter and the claim audit and publishes nothing if either fails.
- **LinkedIn: 3x per week, Tue / Thu / Sat 09:00 IST.** `com.loopdown.linkedin` does NOT post.
  It prepares `data/linkedin-queue.md` (text, carousel path, first comment) and raises a
  notification. Posting stays manual, which is also the last read before it goes out.

Pause either with `launchctl unload ~/Library/LaunchAgents/com.loopdown.<devto|linkedin>.plist`.
A lesson only enters the dev.to queue when its `meta.yaml` says `status: ready`.

Best LinkedIn windows (IST): Tue to Thu, 9 to 11am or 6 to 8pm.

Rhythm per week:
- **Anchor** (Tue): carousel + long-form + LinkedIn. Cross-post dev.to/Medium/Hashnode.
- **Jab** (Thu): single card + short LinkedIn. Punchy, one idea.
- **Optional** (Sat): build-in-public / reflection, lighter.

## Launch plan (fill dates as you go)

| Week | Slot | Post | Series | Format | State |
|------|------|------|--------|--------|-------|
| 1 | Anchor | Teaching a phone to disbelieve its own GPS | Sensors Who Lie | carousel + article | 🟢 LIVE |
| 1 | Jab | CancellationException is not an assassin | The Coroutine Court | carousel + article | 🟡 dev.to LIVE 2026-08-02, LinkedIn pending |
| 2 | Anchor | The 5-second window that crashes your service | The Night Shift | carousel + article | ✅ drafted |
| 2 | Jab | Your LazyColumn recomposes on every scroll | Ghosts in the Recomposition | card + article | ✅ drafted |
| 3 | Anchor | expect/actual is the wrong default in KMP | One Brain, Two Bodies | carousel + article | ✅ drafted |
| 3 | Jab | collectAsState is quietly leaking your work | Ghosts in the Recomposition | card + article | ✅ drafted |
| 4 | Anchor | 24 Room migrations, zero data loss. The rules. | Crossing the Schema | carousel + article | backlog |
| 4 | Jab | I code with a fleet of AI agents. The routing rule. | Notes from the Loop | card + article | backlog |

| 5 | Anchor | Filtered should never mean deleted | Sensors Who Lie | carousel + article | ✅ drafted |
| 5 | Jab | One global threshold is how you delete valid data | Sensors Who Lie | card + article | ✅ drafted |
| 6 | Anchor | Your data model is where uncertainty goes to die | Chain of Custody | carousel + article | ✅ drafted |
| 6 | Jab | When two sensors disagree, rank them | Sensors Who Lie | card + article | ✅ drafted |
| 7 | Anchor | Never silently change a number someone gets paid on | Chain of Custody | carousel + article | ✅ drafted |
| 7 | Jab | Every filter needs a documented exception | Sensors Who Lie | card + article | ✅ drafted |
| 8 | Jab | Invariants are cheap. Silent corruption is not. | Chain of Custody | card + article | ✅ drafted |
| 8 | Jab | Your thresholds do not belong in constants | Chain of Custody | card + article | ✅ drafted |

Weeks 5-8 all come from Alex's comment on post 001 (see notes/gps-provenance-architecture.md).
His reframe, provenance over rejection, turned one post into a two-series arc.

Rules of thumb:
- Reply to every comment in the first 2 hours. Early engagement drives reach more than anything else.
- Anchor posts seed the series; jabs keep you in the feed between anchors.
- Rotate pillars so the feed doesn't feel like one long lecture on the same topic.
- Pull the next idea from `data/backlog.md`; mark it done here.
