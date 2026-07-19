---
title: The Loopdown — Series & Arcs
type: reference
status: living
updated: 2026-07-19
---

# Series & Arcs

Each pillar rolls up into a named series. A series is a promise: "more where this came
from." Put the `series` id in a lesson's frontmatter; it threads related posts and gives
readers a reason to hit *Follow*. (dev.to has native series support — `export.mjs` maps
this field straight to it.)

| Series id | Title | Pillar | Recurring cast | The pitch |
|-----------|-------|--------|----------------|-----------|
| `sensors-who-lie` | **Sensors Who Lie** | location / sensors | The Concussed Witness | Everything your phone senses, and why you shouldn't believe any of it at face value. |
| `the-night-shift` | **The Night Shift** | background execution | Doze the Jailer | Keeping work alive after the screen goes dark — Doze, FGS, WorkManager, hostile OEMs. |
| `ghosts-in-the-recomposition` | **Ghosts in the Recomposition** | Compose performance | The Recomposer | The invisible redraws haunting your UI, and how to exorcise them. |
| `the-coroutine-court` | **The Coroutine Court** | concurrency | The Messenger | Concurrency gotchas tried as courtroom cases. The defendant is usually your assumption. |
| `crossing-the-schema` | **Crossing the Schema** | Room / security | The Ferryman, The Vault Keeper | Persistence as a one-way river: migrations, encryption, and not losing user data. |
| `notes-from-the-loop` | **Notes from the Loop** | build-in-public | The Backlog, The Fleet | Diary from inside the loop — building PaymentsLab, Kursi, HireSignal, and a fleet of AI agents, in public. |

## Format notes

- A series doesn't need to be sequential — each post stands alone, but the arc rewards
  bingeing. (Same as the archive: `Deadline` and `The Loopdown` both use "Day N" beats
  that work standalone and in order.)
- Cross-series crossovers are allowed and delightful when real: The Fleet debugging The
  Recomposer, The Ferryman meeting Null mid-river. Track both in `cast:`.
- Aim for the "Day N / Iteration N" device on `notes-from-the-loop` for that diary pull.
