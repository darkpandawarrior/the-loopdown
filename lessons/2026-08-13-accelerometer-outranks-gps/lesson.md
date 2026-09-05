---
title: "When two sensors disagree, rank them"
slug: accelerometer-outranks-gps
type: lesson
pillar: data-integrity
project: Doori
tags: [android, sensors, sensor-fusion, imu, location]
status: ready
created: 2026-08-13
live:
url_devto:
url_linkedin:
url_medium:
url_hashnode:
channels: [linkedin, devto, hashnode, medium]
series: sensors-who-lie
cast: [the-concussed-witness, the-second-witness]
loop_iteration: 10
---

# When two sensors disagree, rank them

## The hook
Primary: GPS said the car was moving. The accelerometer said the phone had not twitched in ten
minutes. Only one of them can be right, and it is not the one you think.

Variants to A/B:
- We stopped asking "is this reading plausible" and started asking "does anything else agree".
- A second sensor is worth more than a smarter threshold on the first one.
- The accelerometer outranks GPS on the question of whether you are moving. Not on where you are.

## The insight
A single sensor can only ever be checked against itself, which means your filter is really just a
guess about its own input. The moment you have an independent signal you can ask a better
question: do these two agree, and when they do not, which one is authoritative for this specific
question? Rank sensors per question, not overall.

## The story / how it played out
Stationary GPS drift is the classic phantom-distance problem. A parked phone reports small
movements, and reported speed sometimes agrees, because the drift itself looks like motion.

Asking GPS whether GPS is right does not work. So we brought in the accelerometer, which has a
completely different failure mode. It is poor at telling you where you are and excellent at
telling you whether you moved.

Now the pipeline treats physical stillness as authoritative. If the IMU says the device has not
moved, that overrides the GPS speed heuristic and the wander is suppressed, no matter how
confident the fix looked. We extended the same authority to harsh acceleration and braking events,
because a hard stop can momentarily look like stillness to a speed gate and deserves the same
treatment.

The same idea shows up again at journey level, in a much cheaper form: comparing total GPS
distance against the vehicle odometer. Two completely independent measurements of one number. If
they diverge by more than 30 percent we raise a warning rather than silently trusting the one we
happened to compute.

## The takeaway
Do not build a smarter threshold on a lonely sensor. Find a second signal that fails differently
and give it authority over the specific question it is actually good at. Correlation beats
cleverness.

## Receipts
- Mileway pipeline: motionStill and harshAccel override the GPS speed heuristic for jitter.
- Comment in the code says it plainly: accelerometer stillness is authoritative.
- DistanceValidator warns when GPS distance and odometer diverge by more than 30 percent.

## Lore
The Second Witness arrives. Cannot tell you where anything happened, but knows for certain whether
anything happened at all. Between the two of them you finally get a usable account. Series:
Sensors Who Lie, iteration 10.
