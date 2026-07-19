---
title: "Teaching a Phone to Disbelieve Its Own GPS"
canonical: the-loopdown/lessons/2026-07-19-mileway-dead-reckoning
tags: [android, location, kotlin, sensorfusion]
cover: assets/card.png
---

Our app once clocked a user — sitting dead still at a red light — doing 400 km/h.

The phone wasn't lying to be difficult. It was concussed. And that bug taught me
more about building reliable systems than any amount of green CI ever did.

## GPS is a witness with a head injury

We treat GPS like a source of truth. It isn't. It's a witness — and in the places
people actually drive, it's a witness with a concussion:

- **Tunnels.** The receiver loses sky, so it repeats the last position it saw for
  30–40 seconds, then *teleports* to catch up when it reacquires. That teleport,
  divided by the time it took, is your 400 km/h.
- **Urban canyons.** Signals bounce off glass towers (multipath) and place you
  confidently two streets over.
- **Parking garages.** Nothing, then noise.

Mileage tracking lives or dies on trip accuracy, and ours started around 50%. Every
missing percent was a moment GPS lied *confidently*.

## The fix wasn't a better sensor

It was teaching the software when to stop trusting the sensor it had. Three moves:

### 1. Spike detection
For the current travel mode there's a physically possible envelope of speed and
acceleration. Any fix that implies stepping outside it is rejected as a liar. Cheap,
and it kills the most embarrassing errors outright.

### 2. Predictive dead reckoning
When GPS is rejected or missing, don't freeze — estimate. Integrate the
accelerometer against the last good heading and speed to carry position forward. The
phone navigates like a sailor with no stars: it drifts, so you only lean on it
*briefly*, but it bridges the gap until GPS sobers up.

### 3. Sensor fusion
Blend GPS and inertial by confidence weight rather than trusting whichever spoke
last. A strong, consistent fix pulls hard; a jittery one gets outvoted. (A Kalman
filter is the textbook home for this; the point is the *weighting*, not the brand.)

Together: **50% → 95%** accuracy in production. Plus the unglamorous glue — a
foreground service and a floating bubble to survive Doze and OEM battery
restrictions, because a tracker that gets killed is 0% accurate no matter how good
the math is.

## The takeaway

The most reliable systems aren't the ones with the best inputs. They're the ones
that **model how their inputs fail** and degrade gracefully when they do.

Trust, but verify — even your own sensors.
