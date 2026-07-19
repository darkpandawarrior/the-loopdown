---
title: "collectAsState is quietly leaking your work"
slug: collectasstate-leak
type: lesson
pillar: compose-performance
project: Dice
tags: [android, jetpack-compose, flow, lifecycle, collectAsStateWithLifecycle]
status: ready
created: 2026-07-31
channels: [linkedin, devto, hashnode, medium]
series: ghosts-in-the-recomposition
cast: [the-recomposer]
loop_iteration: 6
---

# collectAsState is quietly leaking your work

## The hook
Primary: Your Compose screen is still collecting data while the user is looking at a different app. You probably wrote one line that does it.

Variants to A/B:
- collectAsState keeps collecting when the app is in the background. One word fixes it.
- The screen nobody is looking at is still burning battery. Here is why.
- collectAsStateWithLifecycle should be your default. collectAsState should be the exception.

## The insight
collectAsState starts collecting a flow and only stops when the composable leaves the
composition. Backgrounding the app does not leave the composition, so collection keeps
running, the flow keeps emitting, and the ViewModel keeps working for a screen nobody sees.
collectAsStateWithLifecycle ties collection to the lifecycle, so it stops below STARTED and
resumes on return.

## The story / how it played out
A live screen on Dice kept its upstream flow hot while the app was backgrounded. The
ViewModel kept fetching and the state kept updating off-screen, which wasted battery and
occasionally surprised us with a burst of stale updates when the user returned. The whole
cause was collectAsState instead of collectAsStateWithLifecycle.

```kotlin
// leaks work while backgrounded
val state by viewModel.data.collectAsState()

// stops below STARTED, resumes on return
val state by viewModel.data.collectAsStateWithLifecycle()
```

## The takeaway
Lifecycle awareness is not a thing you bolt on later. It is the difference between work
that stops when the user leaves and work that quietly runs forever. Default to the one
that respects the lifecycle.

## Receipts
- Real off-screen work on a Dice live screen, fixed by collectAsStateWithLifecycle.
- Lives in androidx.lifecycle.runtime.compose.
- Part of the Compose performance and battery pass.

## Lore
The Recomposer returns (second sighting, after Ghosts in the Recomposition iteration 4).
This time it keeps working after everyone has left the room. Series: Ghosts in the
Recomposition, iteration 6. Sign-off: "filed from iteration 6 of the loop."
