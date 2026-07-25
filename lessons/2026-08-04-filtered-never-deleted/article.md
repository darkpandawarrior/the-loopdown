---
title: "Filtered Should Never Mean Deleted"
canonical: the-loopdown/lessons/2026-08-04-filtered-never-deleted
tags: [dataengineering, android, architecture, kotlin]
cover: assets/card.png
---

We shipped a filter that threw away bad GPS readings. Months later somebody asked whether it was
working, and I could not answer. The evidence was gone.

That question changed how I build anything that rejects data.

## The obvious version, and why it rots

Mileage tracking depends on trustworthy distance, and GPS lies constantly. So the first version of
our cleanup did what everyone's first version does:

```kotlin
if (!fix.isPlausible(previous)) return   // drop it, move on
accumulateDistance(fix)
```

Clean data comes out the other end. It feels responsible. It is also a trap, because that `return`
destroys the only record that could ever tell you whether the rejection was correct.

Six months in, someone asked the reasonable question: is the filter right? I could not say how
many readings we had dropped, on which journeys, or whether any of them had been a genuine drive
through a tunnel rather than a glitch. We had built a thing that made a judgement call thousands
of times a day and kept no record of any of it.

## Persist, then classify

The rebuild flipped the default. Rejection stopped being a `return` and became a label.

Only two cases are still deleted, because they cannot physically be real:

```kotlin
// impossible coordinates
if (fix.lat !in -90.0..90.0 || fix.lng !in -180.0..180.0) return null
// impossible accuracy: too precise to be true, or useless
if (fix.accuracyM <= 0.1f || fix.accuracyM >= 250f) return null
```

That is the entire delete list. Everything else is persisted and sorted into named accumulators:

```kotlin
originalDistanceM += displacement          // every metre we ever saw
when {
    fix.isMock  -> mockDistanceM += displacement
    abnormal    -> {
        abnormalDistanceM += displacement
        if (isHardSpike) spikeDistanceM += displacement
    }
    accuracyGated -> { /* recorded, deliberately not counted */ }
    else -> cleanedDistanceM += displacement
}
```

Five numbers instead of one. The UI shows `cleaned`. The rest live beside it.

And the row itself keeps its provenance: accuracy, provider, bearing, altitude, the gyroscope and
accelerometer snapshot, battery level, device model, plus `isMock` and `isAbnormal`. A filtered
reading is still sitting there, labelled with exactly why it did not count.

## What that bought

**Disputes became answerable.** This is mileage that turns into an expense claim. When a driver
says the distance is wrong, we pull the journey and show what was removed and why. Before, the
honest answer was "the algorithm decided", which is not an answer.

**Thresholds became tunable.** We could replay real journeys and ask how much distance we were
classifying as abnormal. Twice the data said our threshold was too aggressive on genuine
motorway driving, and we moved it. That correction is impossible if the rejected steps are gone.

**Ratios became alarms.** Because we keep both numbers, we can assert on their relationship:

```
cleaned = total - (mock + abnormal)
```

and warn when abnormal exceeds half a journey, or when GPS distance and the vehicle odometer
diverge by more than 30 percent. If most of a real trip is landing in the abnormal bucket, the
threshold is wrong, not the driver.

## The general rule

This is not a GPS lesson. Any system that rejects data has the same shape: fraud scoring, metrics
pipelines, log sampling, feature stores, anything with a validation step. The moment you drop a
record, you have made an irreversible claim about it and destroyed the ability to check.

Keeping it is usually cheap. A boolean column and a second accumulator is nothing next to
permanently losing the answer to "is this working?"

So: filtered should never mean deleted. Filtered means "not counted, and here is the reason,
written down, next to the thing itself."

If your pipeline drops rows, find out where they go. "Nowhere" is an answer, just not a good one.
