---
title: "When Two Sensors Disagree, Rank Them"
canonical: the-loopdown/lessons/2026-08-13-accelerometer-outranks-gps
tags: [android, kotlin, sensors, architecture]
cover: assets/card.png
---

GPS said the car was moving. The accelerometer said the phone had not twitched in ten minutes.

## Asking a sensor to check itself

Stationary drift is the oldest problem in location tracking. A parked phone reports small
movements in every direction. Sum the gaps and a car that never left the car park has quietly
driven three kilometres.

The obvious defence is to look at reported speed and ignore readings that claim you are not
moving. It half works, because the drift sometimes carries a plausible speed with it. The fix
looks internally consistent while being completely wrong.

That is the structural problem. A single sensor can only be validated against itself, so every
threshold you add is really a guess about your own input. You can spend months making that guess
more elaborate without making it more correct.

## A second signal that fails differently

The accelerometer is a poor navigator. Integrate it for position and the error compounds within
seconds. But ask it a narrower question, "did this device physically move", and it is far better
than GPS, because its failure modes have nothing to do with satellites, tunnels, or reflections
off a glass tower.

Two sensors that fail differently can check each other. So the pipeline takes both:

```kotlin
fun process(
    fix: GpsFix,
    motionStill: Boolean = false,   // IMU says physically still
    harshAccel: Boolean = false,    // hard accel or braking this fix
): ProcessResult?
```

and when they disagree about movement, the IMU wins:

```kotlin
// drop the sub-gate wander when GPS history shows no movement,
// OR the IMU says still, OR this coincides with a harsh accel/brake event
if ((displacement < gate || stationaryMicroJitter) &&
    (!hasMovementHistory() || motionStill || harshAccel)) {
    return null
}
```

The comment in our source is blunt about why: accelerometer stillness is authoritative.

Harsh braking gets the same authority for a subtle reason. A hard stop can momentarily look like
stillness to a speed gate, and the jitter it produces should not be counted as travelled distance
either.

## Rank per question, not overall

The important nuance is that we did not decide the accelerometer is "better". It is useless for
position. GPS remains the only thing that knows where you are.

What we ranked was authority on one specific question:

| Question | Authority |
|---|---|
| Where are we? | GPS |
| Did we move at all? | Accelerometer |
| How fast, over a distance? | GPS, checked against implied speed |
| Is the environment trustworthy? | Neither, the quality score |

A sensor is not good or bad. It is good at some questions and bad at others, and a fusion strategy
is mostly a table like that one made explicit.

## The cheap version of the same idea

You do not need an IMU to use this principle. At journey level we compare total GPS distance
against the vehicle odometer reading:

```kotlin
val discrepancyRatio = abs(odometer - total) / odometer
if (discrepancyRatio > 0.3) warn(LargeDiscrepancy("odometer-vs-gps", discrepancyRatio))
```

Two completely independent measurements of one number. When they disagree by more than 30 percent,
something is wrong and a human should look, rather than the system silently trusting whichever
number it happened to compute.

Most systems have a signal like this lying around unused. A client-side event count against a
server-side one. A cache's view of a value against the source of truth. A model's confidence
against observed outcomes.

## The takeaway

Do not build a smarter threshold on a lonely sensor. Find a second signal that fails differently,
and give it authority over the specific question it is genuinely good at.

Correlation beats cleverness.
