---
title: "Your Thresholds Do Not Belong in Constants"
canonical: the-loopdown/lessons/2026-08-27-thresholds-in-config
tags: [architecture, kotlin, android, refactoring]
cover: assets/card.png
---

Every tuning change needed a code review, a release, and a week of store rollout. So we stopped
tuning, which is the worst possible outcome.

## Eighteen guesses in a const val

Our location pipeline accumulated roughly eighteen numbers that shaped its behaviour:

- speed band boundaries (walking, cycling, driving)
- a minimum displacement gate for each band
- a stationary speed and jitter threshold
- a rolling history window size and its movement threshold
- a hard teleport gate
- four time-gap tiers, each with a relaxed speed cap
- a maximum plausible gap distance

All `const val`, scattered through the processor. Every one of them was a guess. Informed, tested,
reasonable, and still a guess about how phones behave in the hands of thousands of drivers.

The kind of thing you obviously want to revisit once real data arrives.

## The cost of revisiting

Except revisiting meant: edit code, open a PR, get review, cut a build, push to the store, wait for
rollout. A week at best to move a number by 0.5.

The predictable result is that nobody moved it. Threshold discussions became opinion versus
opinion, because gathering evidence and shipping a correction cost more than the disagreement was
worth. The numbers ossified and then got defended.

Frozen numbers are not stable numbers. They are unexamined ones.

## The unglamorous refactor

```kotlin
@Serializable
data class AbnormalDetectionConfig(
    // speed-band jitter gates
    val walkingMaxMps: Double = 2.5,
    val cyclingMaxMps: Double = 7.0,
    val walkingJitterM: Double = 2.0,
    val cyclingJitterM: Double = 3.0,
    val drivingJitterM: Double = 5.0,
    val stationarySpeedMps: Double = 1.2,
    val stationaryJitterM: Double = 1.2,
    // movement-history window
    val speedHistorySize: Int = 5,
    val movementHistoryMps: Double = 1.5,
    // instant-teleport hard gate
    val spikeHardGateM: Double = 5_000.0,
    // gap-recovery tiers
    val gapMinSec: Long = 30L,
    val gap5mSec: Long = 300L,
    val gap1hSec: Long = 3_600L,
    val gap6hSec: Long = 21_600L,
    val gapTier5mMps: Double = 150.0,
    val gapTier1hMps: Double = 100.0,
    val gapTier6hMps: Double = 60.0,
    val gapMaxDistanceM: Double = 10_000.0,
) {
    companion object {
        /** Exactly today's constants: the no-override baseline. */
        val DEFAULT = AbnormalDetectionConfig()
    }
}
```

Injected into the processor:

```kotlin
class LocationProcessor(
    private val abnormalConfig: AbnormalDetectionConfig = AbnormalDetectionConfig.DEFAULT,
    // ...
)
```

That is the entire change. No new abstraction, no strategy pattern, no plugin system. One data
class and a constructor parameter.

## Two details that made it land

**The defaults are byte-identical to the old constants.** This makes the refactor provably
behaviour neutral: every existing test passes untouched, and the diff is a pure move. That is the
only kind of large refactor that gets approved without argument, and it is worth some care to
achieve.

**It stages.** Debug settings could override the config the same week. Later, server-driven config
became a change to *where the object is constructed*, not to the algorithm. The processor never
learns where its numbers came from, which is exactly the property you want.

Worth being clear about what this is not. It is not a feature-flag system, a rules engine, or
remote code execution. It is a struct of numbers with sane defaults. The moment tuning parameters
become a DSL, you have built a second product nobody asked for.

## The line I would draw

A `const val` is for something that genuinely cannot change: metres in a kilometre, the number of
milliseconds in a second, a protocol constant.

A threshold in a heuristic is a hypothesis about the world. Hypotheses must be cheap to revise, or
they quietly turn into dogma defended by whoever picked them.

If changing a number in your system requires a release, you will guess instead of measure. Fix the
cost of changing it, and measuring becomes the easier path.
