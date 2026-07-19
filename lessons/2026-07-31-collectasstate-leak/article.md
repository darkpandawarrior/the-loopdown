---
title: "collectAsState Is Quietly Leaking Your Work"
canonical: the-loopdown/lessons/2026-07-31-collectasstate-leak
tags: [android, jetpackcompose, kotlin, flow]
cover: assets/card.png
---

Here is a line you have written a hundred times:

```kotlin
val state by viewModel.data.collectAsState()
```

It looks harmless. It is the standard way to turn a `Flow` into Compose state. And on a
screen with live data, it quietly keeps working long after the user has walked away.

## The screen nobody is watching

`collectAsState` starts collecting the flow and stops only when the composable leaves the
composition. That sounds right until you remember what backgrounding an app does, which is
almost nothing to the composition. Send the app to the background and the composable is
still composed. So the collection keeps running. The flow keeps emitting. Your ViewModel
keeps fetching, computing, and pushing new state to a screen that is not on screen.

On a live price ticker or a location feed, that is real battery and mobile data spent in
the dark. It is also a quiet source of bugs, because off-screen updates can pile up and
then hit the user with a jump of stale changes the moment they return.

## The one-word fix

```kotlin
val state by viewModel.data.collectAsStateWithLifecycle()
```

`collectAsStateWithLifecycle` ties the collection to the lifecycle owner. When the
lifecycle drops below `STARTED`, it stops collecting. When it comes back, it resumes. If
your upstream is a `stateIn` or `shareIn` flow with `WhileSubscribed`, the whole pipeline
can now go cold while hidden and warm back up on return. Nobody pays for a screen that is
not visible.

It lives in `androidx.lifecycle.runtime.compose`. Add the dependency, change the one call,
and the leak is gone.

## Make it the default

Treat `collectAsStateWithLifecycle` as the default and plain `collectAsState` as the
exception. The rare time you actually want collection to continue while the screen is
hidden should be a deliberate, commented decision, not something you got by reaching for
the shorter name out of habit.

## The takeaway

Lifecycle awareness is not a nice-to-have you bolt on later. It is the line between work
that stops when the user leaves and work that runs forever in the background. The
Recomposer does not mind an empty room. It will happily keep redrawing it. Your job is to
turn the lights off when everyone goes home.
