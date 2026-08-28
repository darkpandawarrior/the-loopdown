---
title: "Your Data Model Is Where Uncertainty Goes to Die"
canonical: the-loopdown/lessons/2026-08-11-uncertainty-dies-in-data-model
tags: [dataengineering, architecture, android, database]
cover: assets/card.png
---

The sensor knew how much to trust itself. Our database column did not have room for that, so we
threw it away on the way in.


![The Archivist, drawn as a specimen plate. You cannot backfill confidence you discarded. Labelled THE ARCHIVIST, Provenance.](assets/carousel/slide-02.png)

## Everything arrives with an error bar

<!-- figures:start -->
![The schema: Design the row to carry doubt](assets/carousel/slide-03.png)
<!-- figures:end -->

Android hands you a `Location` object that is far richer than a point on a map. It has an accuracy
radius in metres, the provider that produced it, a bearing, an altitude, a timestamp, sometimes a
speed. The platform is telling you, on every reading, how much to believe it.

This is not special to GPS. Models return confidences. Caches know their staleness. Upstream APIs
know whether they served fresh data or a fallback. Almost every value in a real system arrives
with a companion signal about its own reliability.

And almost every schema drops it.

Our first table was the obvious one:

```kotlin
@Entity
data class LocationData(
    val lat: Double,
    val lng: Double,
    val speed: Float,
    val date: Long,
)
```

Reasonable. Minimal. Exactly what the feature needed. It also silently discarded the accuracy
radius on every write, which meant the discard was permanent.

## The questions you cannot answer later

<!-- figures:start -->
![The columns: What every row owes you](assets/carousel/slide-05.png)
<!-- figures:end -->

Within a few months, the real questions arrived:

- Was this journey tracked well, or was the phone in a basement the whole time?
- Which readings were fused location and which were raw GPS?
- Was the device physically moving when this arrived, or just drifting?
- Why is this trip's distance different from the driver's odometer?

Not one of those is an algorithm problem. They are all schema problems. The information existed at
write time, in memory, for free, and we did not have a column for it.

You cannot backfill confidence. Once the row is written without it, that uncertainty is gone for
every future reader, forever.

## The row that carries its papers

<!-- figures:start -->
![The payload: You cannot backfill confidence you discarded](assets/carousel/slide-06.png)
<!-- figures:end -->

What we persist now:

```kotlin
data class LocationData(
    // the reading
    val lat: Double, val lng: Double, val speed: Float,
    val bearing: Float, val altitude: Double, val locationTime: Long,
    // how much to trust it, and where it came from
    val accuracy: Float,
    val provider: String,
    // what the device was doing
    val gyroscopeX: Float, val gyroscopeY: Float, val gyroscopeZ: Float,
    val accelerometerX: Float, val accelerometerY: Float, val accelerometerZ: Float,
    val batteryPercentage: Double,
    val deviceModel: String, val appVersionName: String,
    // what we already decided about it
    val isMock: Boolean,
    val isAbnormal: Boolean,
    val isPaused: Boolean,
    val displacement: Double,
)
```

Three groups, and the third is the one people skip. Storing our own verdict next to the evidence
means a later reader can see both what we concluded and what we concluded it from. When a
threshold turns out to be wrong, every affected row is identifiable rather than theoretical.

## Confidence as a number, not a vibe

Raw columns let you reconstruct the truth. They do not make it usable in a UI. So the environment
collapses into a single score, 0 to 100:

| Condition | Penalty |
|---|---|
| Permission missing | 30 |
| Mock location | 25 |
| Process killed | 20 |
| Restarted | 20 |
| GPS off | 20 |
| Battery optimised | 15 |
| Power saver | 15 |

plus an accuracy tier (15m or better is free, worse than 75m costs 20) and a small bonus when the
fix stream is stable. Now the app can say "this journey was tracked in poor conditions" instead of
presenting a number with false confidence.

## The rule

Design the row to carry doubt. If a value can be wrong, the schema needs somewhere to record how
wrong, where it came from, and what you already decided about it.

Those columns are cheap. Add them before you need them, because the alternative is discovering at
query time that the answer was thrown away at write time, months ago, by a schema that assumed
confidence did not matter.
