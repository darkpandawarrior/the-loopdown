---
title: "One global threshold is how you delete valid data"
slug: one-global-threshold
type: lesson
pillar: data-integrity
project: Mileway
tags: [android, location, thresholds, heuristics, sensor-fusion]
status: ready
created: 2026-08-06
live:
url_devto:
url_linkedin:
url_medium:
url_hashnode:
channels: [linkedin, devto, hashnode, medium]
series: sensors-who-lie
cast: [the-concussed-witness]
loop_iteration: 8
---

# One global threshold is how you delete valid data

## The hook

<!-- figures:start -->
![The cast: One number, every context](assets/carousel/slide-02.png)
<!-- figures:end -->

Primary: Our jitter filter worked perfectly, right up until someone sat in Bangalore traffic.

Variants to A/B:
- A single global threshold is the most confident wrong decision in your codebase.
- The filter could not tell a parked car from a car moving at walking pace. Those are different.
- Thresholds should be relative to context. Almost nobody writes them that way first.

## The insight

<!-- figures:start -->
![The claim you made: A constant is an assumption](assets/carousel/slide-03.png)
<!-- figures:end -->

A constant like "ignore movement under 5 metres" is really a claim that 5 metres means the same
thing while walking, cycling, driving, and sitting in traffic. It does not. Every threshold worth
keeping is a function of context: current speed band, time since the last reading, and what the
recent history says.

## The story / how it played out

<!-- figures:start -->
![The fix: Thresholds take context](assets/carousel/slide-05.png)
<!-- figures:end -->

GPS wanders while you are stationary. A parked phone will drift a few metres and each drift looks
like distance. So you add a floor: ignore steps under N metres.

Pick N=5 and parked cars stop drifting. You ship it. Then a driver crawls through traffic at
walking pace, every genuine step lands under 5 metres, and you silently delete their entire
journey. The filter was not broken. The threshold was just pretending one number fits every
situation.

What replaced it:

Speed bands, so the gate matches how fast you are actually going:
walking under 2.5 m/s gets a 2m gate, cycling under 7 m/s gets 3m, driving gets 5m.

Gap-aware caps, because a big jump after a long silence is legitimate. Under 30 seconds, a 5km
jump is a teleport and anything over 70 m/s is a spike. As the gap grows the cap relaxes by tier:
150 m/s within 5 minutes, 100 within an hour, 60 within six hours. Past six hours we stop testing
speed and use a flat 10km distance gate instead.

History-relative decisions, which is the part that actually saved the traffic case. A small step
is only dropped when a rolling window of the last 5 readings averages under 1.5 m/s. Sustained
slow movement is movement. Genuine stillness is stillness. The window tells them apart.

## The takeaway

<!-- figures:start -->
![The payload: A constant with no context is a bug on a delay](assets/carousel/slide-06.png)
<!-- figures:end -->

When you write a constant into a filter, ask what context you are assuming. If the answer is "all
of them", you have not written a threshold, you have written a bug with a delay on it.

## Receipts
- Mileway AbnormalDetectionConfig: walking/cycling/driving jitter gates, gap tiers, history window.
- 5 reading rolling speed window at 1.5 m/s decides whether a sub-gate step is jitter.
- All values live in a serialisable config, not constants, so tuning is not a release.

## Lore
The Concussed Witness, still unreliable, now being questioned more carefully. You do not ask a
witness the same question at a standstill and at 100kmph and expect the answer to mean the same
thing. Series: Sensors Who Lie, iteration 8.
