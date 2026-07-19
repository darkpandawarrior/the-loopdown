---
title: "The 5-Second Window That Crashes Your Foreground Service"
canonical: the-loopdown/lessons/2026-07-22-foreground-service-five-seconds
tags: [android, foregroundservice, kotlin, workmanager]
cover: assets/card.png
---

Our background service crashed for thousands of users, and the stack trace pointed at a
line that does nothing wrong.

The exception was `ForegroundServiceDidNotStartInTimeException`. I had to look it up. And
once I understood it, a whole class of "works on my machine" bugs made sense.

## The promise you make

When you start a foreground service, you are telling Android something specific: I am
about to show a persistent notification and do work the user cares about, so please do
not kill me the moment the screen sleeps. That is a real privilege. Foreground services
get to keep running when almost nothing else can.

Android grants it on one condition. You have about 5 seconds from starting the service to
calling `startForeground()` with a notification. Keep that promise and you get to stay.
Miss it and the system kills the service and throws.

## Why it only broke for some users

Our service did this:

```kotlin
override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val trip = tripStore.restoreLastTrip()   // disk + db read
    val config = settings.load()             // more io
    startForeground(ID, buildNotification(trip, config))
    return START_STICKY
}
```

On my phone, `restoreLastTrip()` and `settings.load()` finished in under 100
milliseconds. On a cheap device under memory pressure, with the disk busy and the CPU
throttled, they sometimes took four or five seconds. By the time we reached
`startForeground()`, the window had closed. The crash only ever showed up on low-end
devices, which is exactly the population least likely to file a good bug report.

## The fix

Post the notification first. Always. Then do the slow work.

```kotlin
override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    startForeground(ID, buildMinimalNotification())   // keep the promise instantly

    serviceScope.launch {
        val trip = tripStore.restoreLastTrip()
        val config = settings.load()
        updateNotification(buildNotification(trip, config))   // enrich it later
    }
    return START_STICKY
}
```

The minimal notification can say something plain like "Starting trip tracking." The user
sees it for a fraction of a second before the real one replaces it. That is a fine price
for not crashing.

## The Android 12 twist

On Android 12 and up there is a second rule that catches people. In many cases you cannot
start a foreground service from the background at all. If your trigger fires while the app
is not visible, the launch itself throws.

The answer is usually not to fight it. It is to use `WorkManager` with an expedited
request, which is the platform's sanctioned way to say "this is urgent, but let the system
schedule it."

```kotlin
val work = OneTimeWorkRequestBuilder<TripWorker>()
    .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
    .build()
WorkManager.getInstance(context).enqueue(work)
```

## The takeaway

The platform is not out to get you. Every one of these rules exists because some app,
somewhere, tried to run forever and drained a stranger's battery. Post your notification
first, respect the background-start limits, and the system leaves your work alone.

Doze the Jailer runs the night shift. You get 5 seconds to explain why you belong. Explain
fast.
