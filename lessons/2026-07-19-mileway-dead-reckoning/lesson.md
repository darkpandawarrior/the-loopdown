---
title: "Teaching a phone to disbelieve its own GPS"
slug: mileway-dead-reckoning
type: lesson
pillar: location
project: Mileway
tags: [android, location, sensor-fusion, dead-reckoning, kalman]
status: ready
created: 2026-07-19
channels: [linkedin, devto, hashnode, medium]
---

# Teaching a phone to disbelieve its own GPS

## The hook
Our app once clocked a user, sitting still at a red light, doing 400 km/h.

## The insight
A phone's GPS is not a source of truth — it's a *witness with a concussion*. In a
tunnel, an urban canyon, a parking garage, it hallucinates. The fix isn't a better
sensor; it's teaching the software when to **stop trusting the one it has** and
dead-reckon from motion sensors until GPS sobers up.

## The story / how it played out
Mileage tracking lives or dies on trip accuracy. Ours started at ~50%. The killers
were the moments GPS lied confidently: a bounced signal off a building putting the
user two streets over, a tunnel returning the last-known point for 40 seconds and
then *teleporting* to catch up (hello, 400 km/h).

Three moves took us from 50% → 95%:

1. **Spike detection.** Reject any fix implying an impossible acceleration/speed for
   the current mode. If physics says no, the fix is a liar.
2. **Predictive dead reckoning.** When GPS is rejected or missing, estimate position
   from the accelerometer + last good heading and speed. The phone navigates like a
   sailor with no stars — briefly, but well enough to bridge the gap.
3. **Sensor fusion.** Blend GPS + inertial with confidence weights instead of
   trusting whichever spoke last. Good GPS pulls hard; bad GPS gets outvoted.

## The takeaway
The most reliable systems aren't the ones with the best inputs. They're the ones
that model *how their inputs fail* and degrade gracefully when they do. Trust, but
verify — even your own sensors.

## Receipts
- GPS accuracy 50% → 95% (Mileway, production).
- Foreground service + floating bubble kept the pipeline alive through Doze / OEM
  battery restrictions.
- Contributed to the 80% crash-reduction work on the same platform.
