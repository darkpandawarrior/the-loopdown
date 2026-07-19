---
title: "Teaching a Phone to Disbelieve Its Own GPS"
canonical: the-loopdown/lessons/2026-07-19-mileway-dead-reckoning
tags: [android, location, kotlin, sensorfusion]
cover: assets/card.png
---

The bug report came in on a Tuesday. One line:

> "Your app says I hit 400 kmph. I was at a red light."

He wasn't lying. Neither was the app. The phone genuinely believed it, and that is the interesting part.

I work on mileage tracking. If you have ever had an app quietly log your drives for expenses or taxes, that is the category. Trip accuracy is not a feature of the product. It is the product. When we started, ours sat around 50 percent, and almost every missing point traced back to the same thing: the phone lying to us with total confidence.

Here is how we got it to 95, and the one idea underneath all of it.

## GPS is a witness with a concussion

We treat GPS like a source of truth. Out in the world, where people actually drive, it behaves more like a witness who took a hard knock to the head. Confident. Cooperative. Frequently wrong.

Three places break it badly:

**Tunnels.** The receiver loses its view of the sky. Instead of admitting that, it keeps reporting the last position it had, sometimes for 30 to 40 seconds. Then you come out the other end, it reacquires, and it snaps to your real location in a single jump. Take that jump, divide by the tiny time it took, and you get a parked car doing 400 kmph.

**Urban canyons.** Signals bounce off glass towers before reaching you (multipath, if you want the word). The phone averages the reflections and places you a street or two over, very sure of itself.

**Parking garages.** Nothing, then noise, then nothing again.

None of these are edge cases. They are Tuesday. So the question stopped being "how do we get better GPS" and became "how do we stop believing bad GPS."

## Fix 1: catch the liars

The cheapest win first. For any travel mode there is a physically possible envelope. A person walking does not teleport 200 meters in a second. A car does not accelerate like a missile. So before a reading touches the trip, check whether it implies something physics would not allow.

```kotlin
fun GpsFix.isImpossible(prev: GpsFix, mode: Mode): Boolean {
    val meters = haversine(prev, this)
    val seconds = (timestamp - prev.timestamp).coerceAtLeast(1)
    val speed = meters / seconds
    return speed > mode.maxPlausibleSpeed   // walking, cycling, driving each differ
}
```

If it is impossible, drop it. This one guard killed the most embarrassing errors on its own, including the 400 kmph report. It is not clever. It just refuses to be gaslit.

## Fix 2: dead reckoning, so a gap is not a hole

Rejecting bad points leaves you with gaps, and a tunnel is a big one. If you freeze until GPS comes back, the trip gets a straight line cutting across three streets.

So when GPS drops out, stop waiting for it and estimate. Take the last good heading and speed, read the accelerometer, and carry the position forward yourself. Old sailors did this by feel, no stars, no landmarks, just direction and time and a good guess. It drifts, so you cannot lean on it for long. But a tunnel is short, and "roughly right for 40 seconds" beats "confidently wrong" or "a hole in the map."

```kotlin
fun deadReckon(last: Position, imu: Imu, dt: Float): Position {
    val speed = last.speed + imu.forwardAccel * dt
    val distance = speed * dt
    return last.movedBy(distance, heading = last.heading + imu.turnRate * dt)
}
```

The trick is knowing when to trust it and when to hand control back to GPS the moment GPS is worth trusting again.

## Fix 3: fuse, do not just pick

Which brings us to the real fix. Most of the accuracy came from stopping the "believe whoever spoke last" habit and weighing every input by how much it deserves belief right now.

A clean, consistent GPS fix pulls the estimate hard toward itself. A jittery one barely moves it. The dead-reckoned guess fills the space between. Nobody gets a veto. Everybody gets a vote, weighted by confidence.

A Kalman filter is the textbook home for this, and if you reach for one, good. But the win is not the filter. The win is the mindset: hold several noisy opinions at once, and lean toward the one that looks trustworthy this second.

## The unglamorous half

None of this matters if the tracker is dead. On Android, the moment the screen sleeps, the system starts looking for background work to kill, and aggressive OEM skins kill harder. We ran the pipeline in a foreground service with a small floating bubble, partly so the user could see it working, mostly so the OS would leave it alone. A tracker that gets killed is 0 percent accurate no matter how good the math is. I spent nearly as long on staying alive as on the algorithm.

## What actually took us from 50 to 95

Not one silver bullet. Spike detection removed the garbage. Dead reckoning covered the gaps. Fusion made the whole thing coherent. Staying alive made it real. Each one bought a chunk, and they compounded.

## Steal this

- Treat every external input as a witness who might be concussed, not a source of truth.
- Give physics a veto. The cheapest correctness check is "could this even happen."
- When a signal drops, degrade to a rough estimate instead of freezing or guessing wildly.
- Weight inputs by live confidence, not recency.
- Keep the thing alive first. Perfect logic in a killed process is worth nothing.

The one line I kept after all of it: good systems are not the ones with perfect inputs, because nobody gets perfect inputs. Good systems assume their inputs will lie, and plan for the day they do.

Trust, but verify. Especially your own sensors.
