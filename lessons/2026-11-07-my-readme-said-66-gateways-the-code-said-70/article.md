---
title: "My README Said 66 Gateways. The Code Said 70."
canonical: the-loopdown/lessons/2026-11-07-my-readme-said-66-gateways-the-code-said-70
tags: [documentation, testing, kotlin, buildinpublic]
cover: assets/card.png
---

My README said 66 payment gateways. A fixture in the app said 68. The registry actually assembled 70. Nobody lied, and all three numbers had been true once.

![The Archivist, drawn as a specimen plate. Labelled THE ARCHIVIST, exhibit 03.](assets/carousel/slide-02.png)

## How a true number goes stale

PaymentsLab-KMP is a payments integration lab. There's one `PaymentGateway` contract, and a registry that collects every provider through Koin's `getAll<PaymentGateway>()`. The README says how many gateways that adds up to, because "70 gateways behind it" is the sort of line that makes a README worth opening.

On 2026-09-07 I traced the registry through `PaymentsLabApplication`'s Koin wiring and counted what it really assembles: 15 single-instance native-SDK modules, 1 wallet, 44 hosted-webview gateways, 7 mobile-money flows and 3 stub or docs-only entries. That's 70.

The README claimed 66. The Home screen's Roborazzi fixture claimed 68. Both had been correct at some point, which is why this drift is so quiet. Nothing was ever invented. The code moved and the prose stayed where it was.

The same day I fixed two more counts in the same file. "Ten new provider modules" listed nine. "The other 55 gateways" undercounted the two named generic archetypes, which are 44 plus 7, so 51. Same disease, different sentence.

## Stop correcting, start asserting

A fourth correction would have been wrong again within a month, so I wrote a test instead. `ReadmeGatewayCountTest` computes the count the way the app does and checks that the README says so:

```kotlin
val trueCount =
    singleInstanceGatewayCount +   // 15, a documented constant
        1 +                        // wallet
        allMobileMoneyConfigs.size +
        allHostedGatewayConfigs.size +
        allStubGatewayConfigs.size

assertTrue(readme.contains("$trueCount gateways behind it"))
```

To make that possible I lifted the hosted-webview, mobile-money and stub config lists out of inline code into named values. No behaviour changed. The test just needed to sum the same lists the app hands to the registry. Now adding a gateway to one of those lists without updating the README fails the build, and the failure message names the exact phrase to write.

A second test does the same for the "the other N gateways generically" sentence, which is only the two generic archetypes added together.

## The seam, written down

The test can't count the 15 single-instance modules. Each is a hand-written Koin module, not an entry in a list, so there's nothing to sum. That number stays a constant in the test file, with a comment that says to update it in the same change that adds or removes one of those modules.

I like that this is explicit. A guard with a documented seam tells the next person where it stops. A guard that looks complete and isn't is how you get a green build that proves nothing.

## The claim it doesn't cover

While I was writing this up, I looked two screens down the same README. The module map says "14 include()s in settings.gradle.kts". I counted the file on `origin/main` as of 2026-10-28. It has 17.

So the test guards the sentence that had already burned me, which is the cheapest thing to guard, and a sibling claim sat there drifting the whole time. A mechanical check protects one sentence. It does not protect the document.

## What I'd do

1. If you can derive a number from your code, derive it in a test and make the README answer to it.
2. If you can't, say so in the test, next to the constant you have to maintain by hand.
3. Then go and find the next hand-written number. There is one, and it's probably in the module map.

(The counts here are as of those commits and will move. That's the point of the mechanism, and the reason I'd rather not trust the figure.)

The Archivist keeps papers in order. This time he was auditing me.

Filed from iteration 20 of the loop.
