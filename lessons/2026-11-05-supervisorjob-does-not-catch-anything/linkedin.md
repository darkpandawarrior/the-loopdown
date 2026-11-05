<!-- LinkedIn adapt · human, no em dashes -->

My app has a SupervisorJob, four launches into it, and zero exception handlers. The name had me feeling safer than the code deserved.

SupervisorJob changes one rule: a failing child doesn't cancel its siblings. That's it. It doesn't catch the exception. A launch with no handler passes it to the thread's uncaught handler, and on Android that ends the process. Sibling isolation is lovely until the process itself dies.

Doori's app scope is CoroutineScope(SupervisorJob() + Dispatchers.IO). The first launch into it, the legacy mileage backfill, is careful: runCatching, rethrow CancellationException, log the rest. The three after it have no wrapper.

I searched the repo for CoroutineExceptionHandler. No matches. SupervisorJob? Twenty Kotlin files.

I have no crash report for any of them, and I haven't read every callee. They probably work today. But at the scope level, nothing sits between a future exception and a dead process.

Decide where a failure goes before you decide who it may cancel. One handler in the scope, or a wrapper on each launch.

Read "SupervisorJob" as "doesn't propagate sideways". Not "handles errors".

How many of your scopes have a supervisor and no handler?

#Kotlin #Coroutines #Android
