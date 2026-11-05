<!-- LinkedIn adapt · human, no em dashes -->

I put a one hour timeout on my wake lock so it could never leak. Then I went looking for the line that renews it.

There isn't one.

Doori's tracking service takes a partial wake lock at trip start: acquire(timeout), comment says "safety cap: one hour". Released on stop and in onDestroy. I'd defend it in any review.

But I searched for every acquire. One call, in the trip-start path. Nothing runs at minute 59. A trip over an hour is still tracked, but it no longer holds the lock the code says it holds.

The funnier find: LocationTrackingConstants.kt has its own wake lock tag and a ten minute max. Nothing uses either. The live lock has another tag and a sixty minute cap, in a private constant elsewhere. Grep for the timeout and you find the wrong one first. (I did.)

Does anything break at minute 61? I don't know. The foreground service keeps the process alive and location callbacks wake the CPU anyway, so maybe nothing visible. I haven't measured it.

A timeout is a leak guard. It's also a cliff. Renew it on a schedule you can name, or write down why expiry is fine.

Where does your code promise something it only keeps for an hour?

#Android #Kotlin #Doze #SoftwareEngineering
