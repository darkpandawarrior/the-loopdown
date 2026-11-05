---
title: "The wake lock with an expiry date"
slug: the-wake-lock-with-an-expiry-date
type: lesson
pillar: background-execution
project: Doori
tags: [android, wakelock, foreground-service, doze, battery]
status: draft
created: 2026-11-03
live:
url_devto:
url_linkedin:
url_medium:
url_hashnode:
channels: [linkedin, devto, hashnode, medium]
series: the-night-shift
cast: [doze-the-jailer]
loop_iteration: 18
---

# The wake lock with an expiry date

## The hook
Primary: I put a one hour timeout on my wake lock so it could never leak. Then I went looking for the line that renews it, and there isn't one.

Variants to A/B:
- A timeout is the safest argument you can pass to WakeLock.acquire(). It is also a date on which your code quietly changes behaviour.
- Doze isn't the enemy. But my wake lock has a birthday, and nobody wrote it down.
- Two constants named after the same wake lock, neither one used. The real one is private, at the top of a different file.

## The insight
`acquire(timeout)` is the right call. A wake lock with no timeout is a battery bug waiting for an
exception path you forgot. But a timeout turns "held for the length of the trip" into "held for
the length of the trip, or sixty minutes, whichever is shorter", and unless something renews it
that second clause is invisible. You've traded a loud failure (battery drain you can see in
vitals) for a silent one (a guarantee that expires without telling anybody).

## The story / how it played out
Doori's tracking service is a foreground service with `foregroundServiceType="location"`. When a
trip starts it also takes a partial wake lock:

```kotlin
private fun acquireWakeLock() {
    val pm = getSystemService(POWER_SERVICE) as? PowerManager ?: return
    wakeLock =
        pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "mileway:tracking").apply {
            setReferenceCounted(false)
            acquire(WAKE_LOCK_TIMEOUT_MS)
        }
}
```

The timeout is a private constant at the top of `LocationTrackingService.kt`, commented "Safety
cap on the tracking wake lock: one hour". Released on stop, released again in `onDestroy` for
the swipe-away path. Textbook, and I'd have defended it in a review.

Then I was reading the file for a different reason and searched for every `acquire`. One call
site, in the trip-start path. No heartbeat, no renewal, nothing that runs at minute 59. So a
trip that lasts longer than an hour is still being tracked, but it is no longer holding the lock
the code says it holds.

The second thing I found was funnier. `LocationTrackingConstants.kt` has a `WAKE_LOCK_TAG` of
`"LocationTrackingService::WakeLock"` and a `WAKE_LOCK_MAX_DURATION_MS` of ten minutes. Nothing
in the repo references either. The wake lock that runs is tagged `"mileway:tracking"` and capped
at sixty. Two sets of numbers, one live, and the dead set is the one sitting in the file whose
name says "constants". (If you grep for the wake lock timeout, you find the wrong one first.
I did.)

What I can't tell you is whether anything breaks at minute 61. The foreground service and the
location type are what keep the process alive, and location callbacks wake the CPU on their own,
so the honest answer might be "nothing visible". I haven't measured it, and I'm not going to
write a number I made up. The point stands either way: the code makes a promise (held for the
trip) that it only keeps for an hour, and nobody decided that on purpose.

## The takeaway
A timeout on a wake lock is a leak guard. Treat it as a cliff too. Either renew it on a schedule
you can name, or write down in the same comment why expiry is fine, and delete the constants that
describe a lock you don't hold.

## Receipts
- `feature/tracking/src/androidMain/kotlin/com/mileway/feature/tracking/service/LocationTrackingService.kt`: `WAKE_LOCK_TIMEOUT_MS = 60 * 60 * 1000L` (line 71), `acquireWakeLock()` (line 879), single call at trip start (line 426), `releaseWakeLock()` on stop and in `onDestroy`.
- `feature/tracking/src/commonMain/kotlin/com/mileway/feature/tracking/service/LocationTrackingConstants.kt`: `WAKE_LOCK_TAG` and `WAKE_LOCK_MAX_DURATION_MS = 10 * 60 * 1000L`, unreferenced by any Kotlin file in the repo.
- `feature/tracking/src/androidMain/AndroidManifest.xml`: `foregroundServiceType="location"`.
- Not measured: behaviour past minute 60 on a real device. Stated as unknown in the post.

## Lore
Doze the Jailer again. He's not the villain of this one. He's the guard who notices that your
paperwork has an expiry date and you never filed the renewal. Series: The Night Shift, iteration 18.
