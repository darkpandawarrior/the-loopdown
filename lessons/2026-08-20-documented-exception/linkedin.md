<!-- LinkedIn adapt · human, no em dashes -->

A filter with no exceptions has not met production yet. It has only met your test data.

Our rule was simple and correct: GPS readings with accuracy worse than 50 metres do not count toward trusted distance. Poor accuracy usually means a phone in a basement, an underground car park, or a street lined with glass towers. Do not trust it.

Right nearly always. Then we found the case it broke.

A delivery vehicle parked for a long stop. Genuinely stationary, decent fix, but occasionally reporting a slightly wider accuracy radius. Under the blanket rule those readings stopped contributing and the stop turned into a hole in the journey.

The tempting fix is to loosen the threshold. Move 50 to 70 and the complaint goes away, along with the protection you added it for in the first place. You have not solved the edge case, you have deleted the rule.

What we did instead was name the exception:

val exceptionalStationary =
    fix.speedMps <= 0.1f &&      // genuinely not moving
    fix.accuracyM < 20f &&       // still a good fix
    hasMovementHistory()         // and it was moving recently

Three conditions, all required. Together they describe one specific situation: the device is reliably placed rather than drifting. In that situation it may contribute even above the normal threshold.

The name is the part that matters most. Not the logic, the name.

Six months later, nobody has to reverse engineer why those three conditions sit together. Nobody deletes them during a tidy-up because they look arbitrary. There is a comment explaining the reasoning and a test that fails if someone removes it.

An undocumented special case is indistinguishable from a bug. That is exactly how it gets treated, usually by a well meaning refactor at 4pm on a Friday.

The lesson underneath:

Write the rule. Then go looking for the legitimate case it breaks, because there is always one. Give it a name, a comment with your reasoning, and a test.

What is the weirdest carve-out in your codebase that is actually correct?

#SoftwareEngineering #Android #Kotlin #CodeQuality #EdgeCases
