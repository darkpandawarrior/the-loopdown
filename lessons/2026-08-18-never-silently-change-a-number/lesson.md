---
title: "Never silently change a number someone gets paid on"
slug: never-silently-change-a-number
type: lesson
pillar: data-integrity
project: Dice
tags: [product-engineering, trust, ux, data-integrity, android]
status: ready
created: 2026-08-18
live:
url_devto:
url_linkedin:
url_medium:
url_hashnode:
channels: [linkedin, devto, hashnode, medium]
series: chain-of-custody
cast: [the-archivist]
loop_iteration: 11
---

# Never silently change a number someone gets paid on

## The hook
Primary: Our algorithm decided a driver had travelled 4km less than they thought. It was probably
right. Shipping that silently would still have been wrong.

Variants to A/B:
- The moment your output becomes someone's reimbursement, filtering stops being a technical
  decision.
- We were correct and about to lose the argument, because we had no way to show our working.
- If a user cannot see what your algorithm removed, they are not using your product, they are
  trusting it. Those are different.

## The insight
Cleaning data is a technical act right up until the cleaned number pays somebody. After that,
correctness is not sufficient. The user needs to see the original, see what was removed, see why,
and in some cases be able to overrule it. Explicit degradation is a product requirement, not a
nicety.

## The story / how it played out
Mileage tracking on Dice ends in an expense claim. Our pipeline removes GPS spikes, mock location
distance, and implausible jumps. The cleaned figure is more accurate than the raw one, so shipping
only the cleaned figure feels like the obvious call.

It is the obvious call, and it is wrong. A driver who believes they drove 40km and sees 36km has
no way to tell the difference between a good algorithm and a company shaving their expenses. Being
right does not help if the only visible artefact is a smaller number.

So the removal is surfaced. The trip screen shows the original distance alongside the cleaned one,
lists the categories that were removed, and lets the user toggle whether the abnormal segment is
subtracted. Under it sits a diagnostics view listing abnormal and mock distance explicitly.

One detail I like: an app-killed event is deliberately marked as not an irregularity, because the
tracker recovers on its own. Disclosure only means something if you are not crying wolf.

## The takeaway
When your output becomes an input to somebody's money, time, or reputation, correctness is table
stakes and transparency is the actual product. Show the original, show the delta, show the reason,
and let them push back.

## Receipts
- Dice SmartDistanceBottomSheet: original vs cleaned, with a user toggle for abnormal removal.
- TripIrregularitiesDialog surfaces abnormal and mock distance as labelled values.
- App-killed is explicitly classified as not an irregularity to avoid false alarms.

## Lore
The Archivist again, this time as the reason a dispute can be settled. Somebody eventually asks
"why is this number smaller than I remember", and the archive is the difference between an answer
and an argument. Series: Chain of Custody, iteration 11.
