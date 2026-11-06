---
title: "CancellationException Is Not an Assassin (narration script)"
lesson: 2026-07-20-coroutine-cancellation-messenger
source: article.md (published on dev.to 2026-08-28; public text only)
target_length: under 3 minutes at a normal pace, about 400 words
voice: measured, first person, contractions, one aside, direct address. No dashes.
status: draft
---

I cancelled a coroutine. It kept running for eight more seconds. It just didn't care.

Here's the setup. A search screen. You type, it fires a request. You type again, it cancels the old one and fires a new one. (Standard stuff, I thought.) Except every so often the old request finished last and painted stale results right over the fresh ones. I'd called cancel. I'd watched it in the debugger. The job said cancelled. And it carried on anyway.

The culprit was a line I wrote myself.

Cancelling a coroutine doesn't reach in and kill it. It can't. The coroutine has to cooperate. So Kotlin throws a CancellationException up through your suspend calls, and that exception is the message: we're done, unwind, let go of your resources. Your job is to let the message travel.

Now picture my line. A try around a suspend call, and a catch for plain Exception that logs "search failed." Looks careful, doesn't it? Defensive, even. But CancellationException is an Exception, so that catch grabs it, logs something sad, and carries on as if the network had dropped. The coroutine never unwinds. I'd caught the messenger, noted that he looked upset, and locked him in a cell. (The message never got delivered.)

So what do you do instead? A few things, and they're small.

Catch what you actually expect. If a network call can fail, catch the I-O error, because cancellation isn't one, and it sails straight past.

If you really must catch broadly, catch cancellation first and throw it again.

Be careful with runCatching. It's a lovely little helper, and it has the same trap.

And for cleanup that has to run even while you're cancelling, use NonCancellable. A bare catch is the wrong tool for "always close this."

Why did the language make it this way? Structured concurrency. When a parent scope cancels, every child has to wind down and report back up. If one link in the chain swallows the exception, the parent never learns the child stopped, and your careful tree of coroutines turns into orphans running in the dark.

So that exception isn't an error to defend against. It's the one exception in the system doing exactly what you asked.

Cancellation is a conversation, not a kill switch. Swallow the message and the work doesn't stop. It just stops telling you it's still running.

Don't shoot the messenger.
