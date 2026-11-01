---
title: "SupervisorJob does not catch anything"
slug: supervisorjob-does-not-catch-anything
type: lesson
pillar: concurrency
project: Doori
tags: [kotlin, coroutines, android, error-handling, supervisorjob]
status: draft
created: 2026-11-05
live:
url_devto:
url_linkedin:
url_medium:
url_hashnode:
channels: [linkedin, devto, hashnode, medium]
series: the-coroutine-court
cast: [the-messenger]
loop_iteration: 19
---

# SupervisorJob does not catch anything

## The hook
Primary: My application scope has a SupervisorJob, three sibling launches and zero exception handlers. The name had me feeling safer than the code deserved.

Variants to A/B:
- SupervisorJob promises that one child's failure won't cancel its siblings. Nobody promised the failure goes anywhere.
- The Coroutine Court, case file: "the defendant was supervised."
- I grepped my whole app for CoroutineExceptionHandler. Zero hits. I grepped for SupervisorJob. Twenty Kotlin files.

## The insight
`SupervisorJob` changes one rule: a failing child does not cancel its siblings or its parent.
That's all. It doesn't catch the exception and it doesn't log it. A `launch` directly in such a
scope, with no handler in the context, hands the exception to the thread's uncaught exception
handler, and on Android that ends the process. Sibling isolation is a comforting guarantee
right up to the moment the whole process is the thing that died.

## The story / how it played out
Doori's `MilewayApplication` builds one process-wide scope:

```kotlin
private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
```

In `onCreate`, four launches go into it. The first is the legacy mileage backfill, and it's
the careful one:

```kotlin
appScope.launch {
    runCatching { /* backfill */ }
        .onFailure { failure ->
            if (failure is CancellationException || failure !is Exception) throw failure
            Napier.e("Backfill failed; will retry on next app start", failure, tag = "LegacyMileageBackfill")
        }
}
```

It rethrows `CancellationException` (the Messenger's rule, from episode two of this loop), rethrows anything
that isn't an `Exception`, and logs the rest. The three launches after it have no such wrapper:
the database seeding plus the weekly maintenance schedule, `recoverReportPayouts()`, and the
session reconciliation that posts its outcome to a holder.

I want to be careful about what I'm claiming. I don't have a crash report for any of them, and I
haven't read every callee for its own error handling, so some of them may be safe for reasons the
launch site doesn't show. They probably work today. But at the scope level, the thing standing
between a future exception and a dead process isn't the `SupervisorJob`. There is no handler in
the scope's context and no `try` around these calls, and I searched the repo for
`CoroutineExceptionHandler` and got no hits at all.
`SupervisorJob` shows up in 20 Kotlin files, including `TrackingTileService`, where `onClick`
launches `facade.startTracking()` or `stopTracking()` into a supervised scope with no `try`.

So the supervision is real. It guarantees the backfill keeps running when the reconciler throws,
which is a fine promise for a process that the reconciler's exception has just killed.

## The takeaway
Decide where a failure goes before you decide who it's allowed to cancel. Either put a
`CoroutineExceptionHandler` in the scope's context (one line, one place, logs and reports), or
wrap each launch like the backfill. And read the name `SupervisorJob` as "doesn't propagate
sideways", not "handles errors".

## Receipts
- `app/src/main/java/com/mileway/MilewayApplication.kt`: `appScope` at line 195; the wrapped backfill launch from line 252; unwrapped launches at lines 266, 273 and 279.
- `app/src/main/java/com/mileway/qs/TrackingTileService.kt`: `onClick` launches into a `SupervisorJob()` scope with no error handling around `facade.startTracking()` / `stopTracking()`.
- Repo-wide search for `CoroutineExceptionHandler` in Doori's Kotlin sources: no matches.
- Not claimed: that any of these has crashed in production. I have no such report.

## Lore
The Messenger gets a cameo: the one launch that honours his rule is the one with the careful
wrapper. Series: The Coroutine Court, iteration 19. Case status: adjourned until I add the handler.
