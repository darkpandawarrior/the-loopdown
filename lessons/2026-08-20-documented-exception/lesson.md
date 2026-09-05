---
title: "Every filter needs a documented exception"
slug: documented-exception
type: lesson
pillar: data-integrity
project: Doori
tags: [android, filtering, edge-cases, code-quality, location]
status: ready
created: 2026-08-20
live:
url_devto:
url_linkedin:
url_medium:
url_hashnode:
channels: [linkedin, devto, hashnode, medium]
series: sensors-who-lie
cast: [the-concussed-witness]
loop_iteration: 12
---

# Every filter needs a documented exception

## The hook
Primary: A filter with no exceptions has not met production yet. It has only met your test data.

Variants to A/B:
- The rule was right 99% of the time. The 1% was a parked delivery van, and it mattered more.
- If your validation has no carve-outs, either the domain is trivial or you have not found them.
- Name your exceptions in code. An undocumented special case is indistinguishable from a bug.

## The insight
Any rule strict enough to be useful will be wrong for some legitimate case. That is not a failure
of the rule, it is the nature of rules. The engineering question is whether the exception is
named, commented and tested, or whether it lives as an unexplained condition that the next person
deletes during a cleanup.

## The story / how it played out
Our rule: readings with accuracy worse than 50 metres do not count toward trusted distance. Sound,
and correct nearly always. Poor accuracy usually means a phone in a basement or an urban canyon.

The legitimate case it broke: a vehicle parked for a long stop. Stationary, good accuracy, but
occasionally reporting a slightly wider radius. Under a blanket rule those readings stopped
contributing and the stop looked like a tracking hole.

Rather than loosening the threshold for everyone, we named the exception:

```kotlin
val exceptionalStationary =
    fix.speedMps <= 0.1f &&           // genuinely not moving
    fix.accuracyM < 20f &&            // still a good fix
    hasMovementHistory()              // and it was moving recently
```

Three conditions, all required. The device is reliably placed rather than drifting, so it may
contribute even above the normal accuracy threshold. It has a name, a comment explaining the
reasoning, and a test.

The name is the important part. Six months later nobody has to guess why those conditions are
there, and nobody deletes them while tidying up.

## The takeaway
Write the rule, then go looking for the legitimate case it breaks. There is always one. Give it a
name, a comment explaining the reasoning, and a test. An undocumented special case is
indistinguishable from a bug, and gets removed like one.

## Receipts
- Mileway exceptionalStationary: speed <= 0.1 m/s AND accuracy < 20m AND recent movement history.
- Post-resume grace window relaxes the spike gate but still enforces the accuracy gate.

## Lore
The Concussed Witness once more. Even an unreliable witness is occasionally telling the plain
truth, and a court that never allows for it convicts the wrong people. Series: Sensors Who Lie,
iteration 12.
