<!-- LinkedIn adapt · human, no em dashes · passes lint-voice -->

I cancelled a coroutine. It kept running for 8 more seconds. It just did not care.

Took me an embarrassingly long time to find the culprit, and it was one line I wrote myself.

In Kotlin, cancelling a coroutine does not kill it on the spot. It throws a CancellationException up through your suspend calls, and that exception is the whole message: "we are done here, pack up." Polite. Cooperative. Civilized.

Now look at this very reasonable looking code:

try {
    results = api.search(query)
} catch (e: Exception) {
    log("search failed")
}

CancellationException is an Exception. So when cancellation fires, this catch grabs it, logs "search failed", and swallows it whole. The coroutine never gets the message. It just keeps going, and sometimes it wins the race and paints stale results over fresh ones.

You caught the messenger and threw him in a cell. Of course nobody got the news.

The fixes, pick one:

1. Catch what you actually expect. IOException, not Exception.
2. If you must catch broadly, rethrow cancellation first:
   catch (e: CancellationException) { throw e }
   catch (e: Exception) { ... }
3. Know that runCatching { } has the exact same trap. It catches CancellationException too. Handy little footgun.
4. For cleanup that must run even while cancelling, use withContext(NonCancellable) { }, not a naked catch.

The lesson underneath:

Cancellation is a conversation, not a kill switch. If you swallow the message, the work does not stop. It just stops telling you it is still running.

Do not shoot the messenger. Especially when it is the only reason your app shuts things down cleanly.

Ever swallowed an exception you shouldn't have? What did it cost you?

#Kotlin #Coroutines #Android #AndroidDev #SoftwareEngineering
