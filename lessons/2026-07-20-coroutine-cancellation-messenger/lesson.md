---
title: "CancellationException is not an assassin"
slug: coroutine-cancellation-messenger
type: lesson
pillar: concurrency
project: Dice
tags: [kotlin, coroutines, cancellation, structured-concurrency, android]
status: ready
created: 2026-07-20
channels: [linkedin, devto, hashnode, medium]
series: the-coroutine-court
cast: [the-messenger]
loop_iteration: 2
---

# CancellationException is not an assassin

## The hook
Primary: I cancelled a coroutine. It kept running for 8 more seconds. It just did not care.

Variants to A/B:
- The bug was one line I wrote myself: catch (e: Exception).
- Your try/catch is quietly eating the one exception you must never eat.
- Stop shooting the messenger. It is the only reason your app shuts down cleanly.

## The insight
Cancelling a coroutine does not kill it on the spot. It throws a CancellationException
up through your suspend calls, and that exception is the message: we are done, pack up.
A broad catch (e: Exception) swallows that message, the coroutine never hears it, and
the work keeps going. Cancellation is cooperative. Catch the messenger and nobody gets
the news.

## The story / how it played out
A search screen on Dice kept firing stale network work. User types, we cancel the old
job, start a new one. Except the old one kept running and sometimes won the race,
painting old results over new. I had cancelled it. I watched the cancel call run.

The culprit was mine:

```kotlin
try {
    results = api.search(query)   // suspend call
} catch (e: Exception) {
    log("search failed")          // <- eats CancellationException too
}
```

CancellationException is an Exception, so this catch grabbed it, logged "search
failed", and moved on as if nothing happened. The coroutine never unwound. It just
stopped telling me the truth.

The fixes:
1. Catch what you actually expect: IOException, HttpException. Not Exception.
2. If you must catch broadly, rethrow cancellation first:
   `catch (e: CancellationException) { throw e }` then your `catch (e: Exception)`.
3. Know that `runCatching { }` has the same trap. It catches CancellationException too.
4. For cleanup that must run even during cancellation, use
   `withContext(NonCancellable) { ... }`, not a naked catch.

## The takeaway
Cancellation is a conversation, not a kill switch. If you swallow the message, the work
does not stop. It just stops telling you it is still running. Do not shoot the
messenger.

## Receipts
- Real bug on the Dice search flow: stale results overwriting fresh ones.
- Fixed by narrowing the catch and rethrowing CancellationException.
- Part of the structured-concurrency cleanup on the same platform.

## Lore
The Messenger debuts here. Wears an assassin's cloak (it is an exception, it looks
dangerous) but only ever delivers a note that says "we are done here." Everyone kills
the messenger and then wonders why cancellation broke. Series: The Coroutine Court,
iteration 2. Sign-off: "filed from iteration 2 of the loop."
