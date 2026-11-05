---
title: "My README said 66 gateways. The code said 70."
slug: my-readme-said-66-gateways-the-code-said-70
type: lesson
pillar: data-integrity
project: PaymentsLab-KMP
tags: [documentation, testing, kotlin, readme, build-in-public]
status: draft
created: 2026-11-07
live:
url_devto:
url_linkedin:
url_medium:
url_hashnode:
channels: [linkedin, devto, hashnode, medium]
series: chain-of-custody
cast: [the-archivist]
loop_iteration: 20
---

# My README said 66 gateways. The code said 70.

## The hook
Primary: My README said 66 payment gateways. A fixture in the app said 68. The registry actually assembled 70. Nobody lied, and all three numbers had been true once.

Variants to A/B:
- A hand-written number in a README is a claim with no probe attached. Mine was wrong by four.
- I wrote a test whose only job is to fail when my README is out of date. Then I found the claim it doesn't cover.
- Prose about your own code decays on a schedule, and the schedule is "every time you add a module".

## The insight
Any number in your docs that you can derive from your code will drift, because the code is the
one that gets edited. The fix isn't a better habit of remembering to update the README (that
fails exactly when you're busiest). Derive the number the same way the app does, assert the prose
contains it, and let the build be the one that remembers. And be honest about the part you
couldn't derive, because that part still drifts.

## The story / how it played out
PaymentsLab-KMP is a payments integration lab: one `PaymentGateway` contract, a registry that
collects every provider through Koin's `getAll<PaymentGateway>()`, and a README that says how
many there are. On 2026-09-07 I traced the registry through `PaymentsLabApplication`'s Koin wiring
and counted what it really assembles:

- 15 single-instance native-SDK modules
- 1 wallet
- 44 hosted-webview gateways
- 7 mobile-money flows
- 3 stub or docs-only entries

That's 70. The README claimed 66. A hard-coded fixture for the Home screen's Roborazzi rendering
claimed 68. (Both numbers had been right at some point. That's what makes this kind of drift
hard to see: nothing was ever invented, it just stopped being updated.)

The same day I fixed two more counts in the same README ("Ten new provider modules"
listed nine, "the other 55 gateways" undercounted the two named generic archetypes). Same disease.

So the fix wasn't another correction. It was a test, `ReadmeGatewayCountTest`:

```kotlin
val trueCount =
    singleInstanceGatewayCount +   // 15, a documented constant
        1 +                        // wallet
        allMobileMoneyConfigs.size +
        allHostedGatewayConfigs.size +
        allStubGatewayConfigs.size

assertTrue(readme.contains("$trueCount gateways behind it"))
```

To make that possible I pulled the inline lists of hosted-webview, mobile-money and stub configs
out into named values, with zero behaviour change, so the test could sum the same lists the app
wires into the registry. Now adding a gateway to one of those lists without touching the README
fails the build, with a message that tells you the phrase to write.

What the test can't do is count the 15 single-instance modules, because each is a hand-written
Koin module, not a list entry. That number stays a constant with a comment saying "update this in
the same change that adds or removes one of those modules". So the guard has a seam, and it's
named in the file. I'd rather have a seam I've written down than one I've forgotten.

The twist I found while writing this up: two screens down, the README's module map says "14
include()s in settings.gradle.kts". The file has 17. The test I wrote guards the claim that had
already burned me, which is the cheapest thing to guard, and a sibling claim sat there drifting.
That's the honest shape of this lesson: a mechanical check protects one sentence, not the
document.

## The takeaway
If you can derive a number from your code, derive it in a test and make the README answer to it.
If you can't, write down in the test that you couldn't. Then go looking for the next hand-written
number, because there is one.

## Receipts
- `app/src/test/kotlin/com/paymentslab/app/ReadmeGatewayCountTest.kt`: both tests, plus the comment naming the 15 single-instance modules as the one hand-maintained constant.
- Commit `3ee89b6` (2026-09-07): "README claimed 66 gateways; the registry's Home-screen fixture claimed 68 ... currently assembles 70", with the 15 + 1 + 44 + 7 + 3 breakdown.
- Commit `fa6c681` (2026-09-07): "Ten new provider modules" listed 9; "the other 55 gateways" undercounted 44 + 7 = 51.
- README on `origin/main` as of 2026-10-28 (`0c1b6eb`): "14 include()s"; `settings.gradle.kts` on the same commit has 17 `include(":` lines.
- Counts are as of those commits and will move. The lesson is about the mechanism, not the figure.

## Lore
The Archivist again, and this time he's auditing me. "Show your working" applies to the README
too. Series: Chain of Custody, iteration 20.
