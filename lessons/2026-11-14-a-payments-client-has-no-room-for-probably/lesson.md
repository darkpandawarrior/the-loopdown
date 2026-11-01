---
title: "A payments client has no room for probably"
slug: a-payments-client-has-no-room-for-probably
type: lesson
pillar: kmp
project: PaymentsLab-KMP
tags: [payments, idempotency, kotlin, kmp, viewmodel]
status: draft
created: 2026-11-14
live:
url_devto:
url_linkedin:
url_medium:
url_hashnode:
channels: [linkedin, devto, hashnode, medium]
series: one-brain-two-bodies
cast: [the-concussed-witness]
loop_iteration: 23
---

# A payments client has no room for probably

## The hook
Primary: The user pressed Pay, the spinner spun, the request timed out. Did you charge them? If your honest answer is "probably not", you've built the wrong thing.

Variants to A/B:
- A timeout is a witness who stopped talking mid-sentence. You can't ask it again unless asking again is safe.
- The idempotency key isn't a header. It's the lifetime of a decision.
- My request has no amount in it, on purpose. It does have a key.

## The insight
On a payments client, "the request failed" and "the charge did not happen" are different
statements, and the gap between them is where double charges live. The only honest answer to an
ambiguous result is to make retrying safe by construction. That takes one thing, and it's easy to
put in the wrong place: a key that identifies the user's attempt, minted once by whoever owns the
attempt (the ViewModel, not the HTTP layer) and reused until the attempt is over.

## The story / how it played out
In PaymentsLab-KMP, the order request looks like this:

```kotlin
data class CreateOrderRequest(
    val catalogItemId: String,
    val gatewayId: String,
    val idempotencyKey: String,
)
```

No amount. The server resolves the price from `catalogItemId`, so a client can't talk a price
down, and a retry can't change the sum. What the request does carry is a key, "client-generated
once per logical order attempt and reused across retries of the SAME attempt", in the words of
the doc comment on it.

The interesting part is who mints it and when it dies. In `CheckoutViewModel.pay` and
`ProviderLabViewModel.start`, the first thing that happens is:

```kotlin
val idempotencyKey = current.idempotencyKey ?: Uuid.random().toString()
```

Reuse the attempt's key if there is one, otherwise mint. Then the lifetime rules, all in state:

- Pay fails or is ambiguous: the key stays in state, so pressing Pay again is the same attempt.
- Pay succeeds: the key is cleared (`if (terminal == SUCCESS) null else idempotencyKey`), so the next press is a new purchase.
- The user changes product or gateway: the key is set to null, because that's a different order.

On the server, the store writes the order record first, then publishes the key-to-order mapping with
`putIfAbsent`, and a loser of the race returns the winner's order. There's a test for the ugly
case: eight concurrent `createOrder` calls with the same key yield exactly one order id.

Split payments extend it without a new idea. One purchase paid as a wallet leg and a gateway leg
derives two keys, `"$key:wallet"` and `"$key:gateway"`, so replaying the whole split is as safe as
replaying a single payment. If the gateway leg fails after the wallet leg succeeded, the wallet
debit is reversed with a compensating credit.

And all of it, the protocol types, the orchestrator and both ViewModels, lives in `commonMain`.
The platform bodies only host the SDKs. One brain decides what "same attempt" means, on every
platform that runs it.

Two honest limits. The backend here is an in-memory store, and the code says so in a comment:
dedup is process-local, and a real database would want a unique constraint on the key. And I
haven't traced what the server returns when the same key is retried after a definitive decline
rather than an ambiguous timeout. That's a design question I'd want answered before this saw
real money.

## The takeaway
Make the retry safe, not unlikely. Put the key where the attempt lives, tie its lifetime to the
user's intent (changes on a new purchase, survives a failure), and let the server be the one that
says "I've seen this before". "Probably not charged" is not a state a payments client can be in.

## Receipts
- `core/protocol/src/commonMain/kotlin/com/paymentslab/core/protocol/PaymentProtocol.kt`: `CreateOrderRequest` (no amount field) and its doc comment on `idempotencyKey`.
- `feature/checkout-demo/src/commonMain/kotlin/com/paymentslab/feature/checkoutdemo/CheckoutViewModel.kt`: key minted at line 178; reset to null on product (line 152) and gateway (line 157) changes.
- `feature/lab/src/commonMain/kotlin/com/paymentslab/feature/lab/ProviderLabViewModel.kt`: key minted at line 126; cleared only on `SUCCESS` (line 154).
- `backend/src/main/kotlin/com/paymentslab/backend/PaymentStore.kt`: `createOrder` with `putIfAbsent`, record written before the mapping is published.
- `backend/src/test/kotlin/com/paymentslab/backend/BackendTest.kt`: "concurrent createOrder calls with the same idempotencyKey yield a single order" (8 concurrent calls) and the different-keys test.
- `core/orchestration/src/commonMain/kotlin/com/paymentslab/core/orchestration/PaymentOrchestrator.kt`: `paySplit` with `"$idempotencyKey:wallet"` / `":gateway"` and the compensating refund.
- Not claimed: behaviour of retry after a definitive decline; persistence of dedup beyond an in-memory store.

## Lore
The Concussed Witness, in a new costume. A timeout is a witness who went quiet mid-sentence, and
the only safe way to ask again is to ask the same question. Series: One Brain, Two Bodies,
iteration 23.
