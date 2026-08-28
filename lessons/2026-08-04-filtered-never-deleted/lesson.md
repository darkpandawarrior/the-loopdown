---
title: "Filtered should never mean deleted"
slug: filtered-never-deleted
type: lesson
pillar: data-integrity
project: Mileway
tags: [android, data-modelling, filtering, observability, architecture]
status: ready
created: 2026-08-04
live:
url_devto:
url_linkedin:
url_medium:
url_hashnode:
channels: [linkedin, devto, hashnode, medium]
series: sensors-who-lie
cast: [the-concussed-witness]
loop_iteration: 7
---

# Filtered should never mean deleted

## The hook
Primary: We shipped a filter that threw away bad GPS. Months later someone asked if it was
working, and I could not answer, because the evidence was gone.

Variants to A/B:
- A filter you cannot audit is a filter you cannot tune.
- "Filtered" and "deleted" are not the same word, and picking the wrong one cost us months.
- Our pipeline made a judgement call thousands of times a day and kept no record of any of it.

## The insight
Dropping a bad reading destroys the only evidence that could tell you whether dropping it was
correct. Persist everything, classify it into named buckets, and let the trusted number be a
view over the data rather than the only thing that survived. The buckets then become the
instrument you tune the filter with.

## The story / how it played out
When we started cleaning GPS on Mileway, we did the obvious thing. A reading fails the
plausibility check, drop it, move on. Clean data out the other end. It felt responsible.

Then someone asked whether the filter was actually right, and I had nothing. I could not say how
many readings we had dropped, on which journeys, or whether a single one of them had been a real
drive through a tunnel rather than a glitch.

The rebuild inverted it. Only two things get deleted now, because they cannot physically be real:
coordinates outside the valid lat/lng range, and accuracy under 0.1m or over 250m. Everything
else is persisted and sorted:

- originalDistance: every metre we ever saw
- mockDistance: fake location provider
- abnormalDistance: failed the plausibility check
- spikeDistance: teleports, over 5km in one step
- cleanedDistance: the number we actually trust

The row keeps its accuracy, provider, bearing, altitude, IMU snapshot, battery and device model
alongside the flags. So a "filtered" reading is still right there, labelled with why we did not
count it.

That turned the filter from a black box into something we could argue with. Support could pull a
disputed trip and show exactly what was removed. When a threshold felt too aggressive we replayed
real journeys and counted. Twice the data said we were wrong, and we moved the threshold.

## The takeaway
You cannot tune a filter you cannot audit, and you cannot audit what you deleted. If your
pipeline drops rows, know where they go. "Nowhere" is an answer, just not a good one.

## Receipts
- Mileway LocationProcessor: original / cleaned / abnormal / mock / spike accumulators.
- Only two hard drops in the whole pipeline (impossible coordinates, impossible accuracy).
- DistanceValidator enforces cleaned = total - (mock + abnormal) before submission.

## Lore
The Concussed Witness returns. Last time we learned not to believe it. This time we learn not to
throw away its testimony either, because a witness you silenced cannot be cross-examined. Series:
Sensors Who Lie, iteration 7. Sign-off: "filed from iteration 7 of the loop."
