<!-- LinkedIn adapt · human, no em dashes -->

My README said 66 payment gateways. A fixture in the app said 68. The registry actually assembled 70.

Nobody lied. All three numbers had been true once. Nothing was invented, it just stopped being updated.

So I stopped correcting it and wrote a test. It derives the true count the way the app does (15 single-instance modules, 1 wallet, plus the sizes of the hosted-webview, mobile-money and stub config lists) and fails the build if the README doesn't say "70 gateways behind it".

What it can't do: the 15 single-instance modules are hand-written Koin modules, not list entries. That stays a constant, with a comment saying where to update it. A seam I've written down beats one I've forgotten.

Then the twist. Two screens below the sentence I'd guarded, the README's module map says "14 include()s in settings.gradle.kts". The file has 17.

A mechanical check protects one sentence, not the document.

If you can derive a number from your code, derive it in a test and make the README answer to it. If you can't, say so in the test. Then go find the next hand-written number. There is one.

Which number in your README would you bet is still right?

#SoftwareEngineering #Documentation #Kotlin
