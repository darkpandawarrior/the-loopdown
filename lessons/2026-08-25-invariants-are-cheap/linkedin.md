<!-- LinkedIn adapt · human, no em dashes -->

We had five numbers that were supposed to add up. Nothing in the codebase checked that they did.

A tracked journey produces five distances: original, cleaned, mock, abnormal, spike. They have a relationship that everyone on the team knew:

cleaned = original - (mock + abnormal)

Spike is deliberately not in that equation, because it is never folded into the original total, so it must not be subtracted back out either. Subtle, easy to get wrong, and exactly the kind of thing a refactor breaks at 2am six months later.

That rule lived in our heads. Nothing executed it.

So we wrote a validator that runs before submission. Two tiers.

Errors, which block: any negative distance, a component mismatch beyond a 0.1 metre floating point tolerance, or cleaned somehow exceeding the original. These mean the code is wrong. Do not send it.

Warnings, which surface without blocking. This is the part that actually earns its keep:

mock or abnormal above 50 percent of the journey
spike above 30 percent
GPS distance and the vehicle odometer diverging by more than 30 percent

Notice those are a completely different kind of statement. The strict invariant catches code bugs, where the numbers contradict each other. The ratio warnings catch something internal consistency never will: a threshold being wrong. Every number can be perfectly consistent while the filter quietly eats half of a real trip.

If most of a genuine journey is landing in the abnormal bucket, our detection is wrong, not the driver. Only a ratio check tells you that.

The whole validator is maybe eighty lines of pure Kotlin with no dependencies, and it is fully unit tested because there is nothing to mock.

The lesson underneath:

Every system has relationships it assumes and never asserts. Components summing to a total. A subset never exceeding its parent. Two independent measurements staying close. Those rules usually live in a comment or somebody's memory.

Write them as code that runs. Errors for what must never happen, warnings for what is merely suspicious.

What invariant does your system assume but never check?

#SoftwareEngineering #DataIntegrity #Kotlin #Testing #Architecture
