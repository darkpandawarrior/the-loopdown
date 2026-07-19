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
series: sensors-who-lie          # lore/series.md
cast: [the-concussed-witness]    # lore/cast.md — introduces this character
loop_iteration: 1                # the "Day N / Iteration N" device
---

# Teaching a phone to disbelieve its own GPS

## The hook
Primary: "Your app says I hit 400 kmph. I was at a red light." (real bug report, a Tuesday)

Variants to A/B:
- Our app clocked a parked car at 400 kmph. The phone was completely sure.
- Think of your phone's GPS as a witness with a concussion.
- We took trip accuracy from 50 to 95 percent without touching the GPS chip.

## The insight
Treat GPS as a witness with a concussion, not a source of truth. In a tunnel, an
urban canyon, or a parking garage it reports confidently wrong positions. The fix is
not a better sensor. It is teaching the software when to stop trusting the one it has,
and dead-reckon from motion sensors until GPS is worth believing again.

## The story / how it played out
Mileage tracking lives or dies on trip accuracy. Ours started around 50 percent. The
killers were the moments GPS lied with full confidence: a signal bounced off a glass
tower putting the user two streets over, or a tunnel returning the last known point
for 40 seconds and then teleporting to catch up (that jump over that tiny time is the
400 kmph).

Three moves took us from 50 to 95 percent:

1. Spike detection. Reject any fix that implies an impossible acceleration or speed
   for the current mode. If physics says no, the fix is a liar.
2. Predictive dead reckoning. When GPS is rejected or missing, estimate position from
   the accelerometer plus the last good heading and speed. The phone navigates like a
   sailor with no stars: briefly, but well enough to bridge the gap.
3. Sensor fusion. Blend GPS and inertial by confidence weight instead of trusting
   whichever spoke last. Good GPS pulls hard, bad GPS gets outvoted.

## The takeaway
Good systems are not the ones with perfect inputs, because nobody gets perfect
inputs. They are the ones that assume their inputs will lie, and plan for the day they
do. Trust, but verify. Especially your own sensors.

## Receipts
- GPS accuracy 50 to 95 percent (Mileway, production).
- Foreground service plus floating bubble kept the pipeline alive through Doze and OEM
  battery restrictions.
- Contributed to the 80 percent crash-reduction work on the same platform.

## Lore
The Concussed Witness debuts here (GPS that reports with total confidence and zero
reliability). Series: Sensors Who Lie, iteration 1. Sign-off: "filed from iteration 1
of the loop."
