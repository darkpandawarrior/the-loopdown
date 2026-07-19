---
title: "Your LazyColumn recomposes on every scroll"
slug: lazycolumn-recomposition
type: lesson
pillar: compose-performance
project: Dice
tags: [android, jetpack-compose, recomposition, stability, performance]
status: ready
created: 2026-07-24
channels: [linkedin, devto, hashnode, medium]
series: ghosts-in-the-recomposition
cast: [the-recomposer]
loop_iteration: 4
---

# Your LazyColumn recomposes on every scroll

## The hook
Primary: Your LazyColumn redraws every visible row every time anything changes. Here is the one reason it usually happens: you passed it a List.

Variants to A/B:
- A plain List is not a stable type to Compose. That is the whole bug.
- Compose is not slow. You handed it something it could not reason about.
- Turn on recomposition counts and scroll. Every row ticks up. Now you see the ghost.

## The insight
Compose can skip redrawing a composable if it can prove the inputs did not change. That
proof is called stability. A plain List, Map, or Set is unstable, because the compiler
cannot prove the contents did not change under it. Pass one to your rows and Compose
gives up skipping and recomposes them. Hand it an ImmutableList instead and skipping
comes back.

## The story / how it played out
A feed screen on Dice felt heavy while scrolling on mid-range devices. Layout Inspector
showed every visible row recomposing on every scroll frame, even rows whose data had not
changed. The list parameter was a plain List. Compose could not prove it was unchanged,
so it re-ran the rows to be safe.

Two changes fixed it:
1. Pass a stable list: kotlinx.collections.immutable, ImmutableList or persistentListOf.
2. Give items a key: items(list, key = { it.id }) { }, so Compose tracks rows by identity,
   not position.

## The takeaway
Compose is fast by default, as long as you let it prove what did not change. Most "Compose
is janky" problems are really "I handed it something it could not reason about."

## Receipts
- Real jank on a Dice feed, confirmed with recomposition counts in Layout Inspector.
- Fixed by ImmutableList params and stable keys. Scroll went smooth.
- Part of the 92 percent Compose codebase's performance pass.

## Lore
The Recomposer debuts here. A gremlin that redraws the whole room every time you blink.
Feed it an unstable List and it repaints the house. Series: Ghosts in the Recomposition,
iteration 4. Sign-off: "filed from iteration 4 of the loop."
