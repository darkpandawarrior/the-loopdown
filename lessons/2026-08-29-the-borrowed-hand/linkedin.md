<!-- LinkedIn adapt · human, no em dashes · passes lint-voice + ship checklist -->

The API returned 200. The article published. Every single tag was silently dropped, and nothing anywhere said so.

I found it two days later, by accident, looking at something else.

A junior engineer fails in a way you can see. The code looks off, something in the shape of it makes you read twice. That instinct is most of what code review actually is.

Borrowed work does not fail like that. Ask a model for something and it hands you code that looks exactly right, because looking right is the thing it is best at. When your instructions run out it does not stop and ask. It fills the gap with the most plausible thing available, because being helpful is the only mode it has.

So the defect never lands in the syntax, where review is looking. It lands in the seam between what you asked for and what you meant, and it survives review precisely because it reads well.

Two from the same week, in my own tooling:

1. tags: tags.join(",") sent to an API that wants an array. It returned 200, published the post, and dropped all four tags. No error. No warning. The only way to catch it was to fetch the article back and look at what was actually on it.

2. A generator picks a code snippet for each slide. I specified "the first block that fits." It did that perfectly, and on a post about the five second startForeground() window it chose a WorkManager snippet. Real API, correct Kotlin, right file, entirely the wrong point. (One push from teaching a few thousand people something false, beautifully rendered.)

Nobody lied to me. I asked for a block that fits. I meant a block that proves the claim. That gap is the whole bug.

Two things I now do, and both generalise well past AI:

Specify the predicate, not the shape. "Fits the slide" is a shape, and a shape can be satisfied perfectly by something useless. "Contains the API this slide is about" is a predicate. It can fail, and something that fails loudly beats something that succeeds vaguely.

Verify the outcome, not the call. A 200 means the server received your request, not that it did what you wanted. A migration that does not throw is not a migration that kept your data. Check the effect at the boundaries where a silent no-op is expensive.

Then write the check down as something that runs. Your attention is the one component in the system guaranteed to degrade, and it degrades fastest exactly when the output looks good.

Wrong code gets caught. Plausible code ships.

What has slipped past you because it looked right?

Filed from iteration 15 of the loop.

#AI #SoftwareEngineering #CodeReview #Kotlin #AndroidDev
