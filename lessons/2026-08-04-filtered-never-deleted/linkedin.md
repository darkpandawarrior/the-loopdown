<!-- LinkedIn adapt · human, no em dashes -->

We shipped a filter that threw away bad GPS readings. Months later someone asked whether it was actually working, and I could not answer. The evidence was gone.

When we started cleaning location data, we did the obvious thing. A reading fails the plausibility check, drop it, move on. Clean data out the other end. It felt responsible.

Then came the question. Is the filter right?

I had nothing. I could not tell you how many readings we dropped, on which journeys, or whether a single one of them was a real drive through a tunnel rather than a glitch. We had built something that made a judgement call thousands of times a day and kept no record of any of it. (The polite word for that is heuristic. The honest word is guess.)

So we inverted it. Now only two things get deleted, because they cannot physically be real: coordinates outside the valid lat/lng range, and accuracy under 0.1m or over 250m. That is the entire delete list.

Everything else is persisted and sorted into named buckets:

original: every metre we ever saw
mock: fake location provider
abnormal: failed the plausibility check
spike: teleports, over 5km in a single step
cleaned: the number we actually trust

The trip shows the cleaned number. The other buckets sit right beside it, on the row, forever, next to that reading's accuracy, provider and sensor snapshot.

That one change turned the filter from a black box into something we could argue with. A driver disputes their distance, we pull the journey and show exactly what came out and why. A threshold feels too aggressive, we replay real trips and count. Twice the data told us we were wrong and we moved the threshold.

You cannot tune a filter you cannot audit. You cannot audit what you deleted.

If your pipeline drops rows, ask where they go. Nowhere is an answer, just not a good one.

Where does your rejected data end up?

#DataEngineering #Android #SoftwareArchitecture #Observability #Kotlin
