---
title: "Gateway number 71 is one line, and nothing checks it"
slug: gateway-number-71-is-one-line-and-nothing-checks-it
type: lesson
pillar: build-in-public
project: PaymentsLab-KMP
tags: [kotlin, koin, architecture, kmp, dependency-injection]
status: draft
created: 2026-11-12
live:
url_devto:
url_linkedin:
url_medium:
url_hashnode:
channels: [linkedin, devto, hashnode, medium]
series: notes-from-the-loop
cast: [the-understudy]
loop_iteration: 22
---

# Gateway number 71 is one line, and nothing checks it

## The hook
Primary: Adding a payment gateway to my app is one line. I'm proud of that line, and I went looking for what happens when someone adds the same gateway twice.

Variants to A/B:
- "Adding provider N+1 touches no existing code" is true in my repo, and it's also the reason a duplicate fails silently.
- associateBy keeps the last one. Nothing in my registry tells you there were two.
- The cost of auto-discovery is that nobody ever reads the full list.

## The insight
A registry that collects its members through DI is a good design: features depend on one
interface, a new provider is a new module, nobody edits a growing `when`. The price is that the
list is assembled by the container, so no human ever reads all of it in one place, and any
invariant over the whole list (unique ids, say) has nowhere natural to live. Convenience at the
edge and a missing check at the centre are the same decision.

## The story / how it played out
PaymentsLab-KMP has one contract, `PaymentGateway`, and each provider is a Gradle module under
`kmp-toolkit` that contributes itself to Koin:

```kotlin
val razorpayModule: Module =
    module {
        single { RazorpayCallbackRelay } bind PaymentActivityCallbacks::class
        single { RazorpayGateway(get()) } bind PaymentGateway::class
    }
```

The orchestration module builds the registry from whatever has been bound to that type:

```kotlin
single<PaymentGatewayRegistry> { DefaultPaymentGatewayRegistry(getAll<PaymentGateway>()) }
```

and its comment says adding a provider is "a matter of including its module, with no edit here".
In `PaymentsLabApplication` that's one entry in the `modules(...)` list, next to
`razorpayModule`, `stripeModule` and the rest. (The README says gateway N+1 "touches no existing
code", and for the registry, the orchestrator and every feature, that's accurate. I counted 70
gateways on 2026-09-07, so the next one is 71.)

Two caveats on "one line". A single-instance provider also bumps a hand-kept constant in
`ReadmeGatewayCountTest`, which is at least a test, and fails loudly if you forget. And the
registry itself is this:

```kotlin
class DefaultPaymentGatewayRegistry(
    override val gateways: List<PaymentGateway>,
) : PaymentGatewayRegistry {
    private val byId: Map<GatewayId, PaymentGateway> = gateways.associateBy { it.id }
```

`associateBy` is documented to keep the last element when two share a key. So if two modules
contribute a gateway with the same `GatewayId`, `byId` returns whichever comes last in the list,
while `gateways` still contains both. Nothing throws. One gateway would be unreachable by id, and
the first sign could be a flow opening against the wrong provider.

I went looking for a guard. I searched the registry code and the tests for anything about
duplicate, distinct or unique ids and found nothing. The tests that build a registry do it with
one or two fakes. I'm not claiming a duplicate exists today (I haven't proven either way), only
that the system has no way to tell me if one appears.

## The takeaway
When a container assembles your list, own the check on the whole list. For a registry that's one
line at construction, `require(gateways.map { it.id }.distinct().size == gateways.size)`, failing
at startup rather than in production. It's the cheapest line in the file and it's the one that
makes "N+1 touches nothing" honest.

## Receipts
- `external/kmp-toolkit/payments-api/src/commonMain/kotlin/com/siddharth/kmp/paymentsapi/PaymentGatewayRegistry.kt`: `gateways.associateBy { it.id }` (kmp-toolkit repo, `payments-api`).
- `core/orchestration/src/commonMain/kotlin/com/paymentslab/core/orchestration/di/OrchestrationModule.kt`: `getAll<PaymentGateway>()` and the "no edit here" comment.
- `external/kmp-toolkit/provider/razorpay/.../di/RazorpayModule.kt`: `single { RazorpayGateway(get()) } bind PaymentGateway::class`.
- `app/src/main/kotlin/com/paymentslab/app/PaymentsLabApplication.kt`: the `modules(...)` list in `installKoin`.
- `app/src/test/kotlin/com/paymentslab/app/ReadmeGatewayCountTest.kt`: the 15 single-instance constant.
- Count of 70 is from commit `3ee89b6` (2026-09-07) and README on `origin/main` at `0c1b6eb`; it will move.
- Searched, not found: any duplicate-id check in the registry or its tests. Not claimed: that a duplicate exists.

## Lore
The Understudy's cousin. She's cast by name at compile time, but here the casting director is
Koin, and nobody checks that two understudies didn't turn up for the same part. Series: Notes from
the Loop, iteration 22.
