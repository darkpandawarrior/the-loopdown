<!-- LinkedIn adapt · human, no em dashes -->

Our background service crashed for thousands of users, and the stack trace blamed a line that does nothing wrong.

ForegroundServiceDidNotStartInTimeException. I had never heard of it either.

Here is the deal. When you start a foreground service on Android, you make a promise to the system: I am about to show a notification and do visible, important work. The system gives you about 5 seconds to keep that promise by calling startForeground() with a notification.

Miss that window and the system does not wait. It kills the service and throws.

The trap is subtle. People do slow work before startForeground(). They read from disk, hit the database, wait on some init, and only then post the notification. On a fast phone in the office, 5 seconds is forever. On a cold, cheap device under load, it is gone before you finish.

The fix is boring and it works:

1. Call startForeground() first, immediately, with a minimal notification.
2. Do the slow work after, and update the notification once you have real content.
3. On Android 12 and up, remember you often cannot even start a foreground service from the background. Use WorkManager with an expedited request instead.

Think of the system as a night-shift jailer. You get 5 seconds to explain why your work deserves to keep running. Explain fast, or the cell door closes.

The lesson underneath:

The platform is not out to get you. It is protecting the user's battery and attention from apps that want to run forever. Post your notification first, work with the lifecycle, and it leaves you alone.

Ever been burned by a platform deadline you did not know existed?

#Android #AndroidDev #Kotlin #MobileEngineering #SoftwareEngineering
