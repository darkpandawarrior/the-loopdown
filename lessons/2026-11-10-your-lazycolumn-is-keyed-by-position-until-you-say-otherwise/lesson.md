---
title: "Your LazyColumn is keyed by position until you say otherwise"
slug: your-lazycolumn-is-keyed-by-position-until-you-say-otherwise
type: lesson
pillar: compose-performance
project: Doori
tags: [compose, lazycolumn, state, android, kotlin]
status: draft
created: 2026-11-10
live:
url_devto:
url_linkedin:
url_medium:
url_hashnode:
channels: [linkedin, devto, hashnode, medium]
series: ghosts-in-the-recomposition
cast: [the-recomposer]
loop_iteration: 21
---

# Your LazyColumn is keyed by position until you say otherwise

## The hook
Primary: I found a chat list in my own app with no key, and nothing was wrong with it. That's the bug.

Variants to A/B:
- You added one item and the whole list forgot itself. Except mine hasn't, yet, and the reason is an accident.
- items(messages) { } compiles, runs, and passes review. It also quietly means "identity is the row number".
- The fix is five characters. The prerequisite is a data model decision.

## The insight
Without a `key`, a lazy list identifies each item by its position. That's harmless while the list
only ever grows at the end and no row remembers anything. The moment you insert above, delete, or
reorder, every row from that point on is handed a neighbour's identity, along with whatever state
it had remembered. And `key = { it.id }` is only five characters if your ids are actually unique,
because Compose throws on a duplicate key. So the lesson is about the data model first and the
composable second.

## The story / how it played out
Most of Doori's lists pass a key. `CardsHomeScreen` does `items(cards, key = { it.id })`, so do
the offers, the what's new feed and the advances screens. Then I went looking for the ones that
don't, and one of them is the Agent chat screen:

```kotlin
items(messages) { message ->
    AgentMessageBubble(
        message = message,
        onFeedback = { rating -> onFeedback(message.id, rating) },
        feedbackRating = feedbackMap[message.id],
    )
}
```

Position-keyed, in a list of things that have an `id` right there on the model. So is it broken?
I checked. No, and the reasons are lucky ones. A chat only appends. And `AgentMessageBubble`
holds no `remember` of its own: the thumbs up/down state lives in `uiState.feedback`, a map keyed
by `message.id`, hoisted out of the row. Identity-by-position never gets a chance to hand one
message another message's state, because the rows have no state to hand over.

That's a design that works, and it works because of two decisions made elsewhere, neither of them
about the list. The day someone adds `var expanded by remember { mutableStateOf(false) }` to the
bubble, or the product asks for "pin a message" and the list reorders, the missing key starts
mattering, and nothing in the code would have warned them.

Now the part that stops this being five characters. The model's id is
`"${if (isUser) "u" else "a"}_$timestampMs"`. Two messages from the same side in the same
millisecond would share an id, and a keyed `LazyColumn` throws an `IllegalArgumentException` on a
duplicate key. Today that can't hurt, because nobody uses the id as a key. Add the key and you
inherit a crash that was always latent. The honest fix is a unique id (a UUID, or the database
row id) and then the key. (Arrey bhai, one line in the composable, one column in the schema.)

## The takeaway
A missing `key` is invisible while your list is simple and your rows are stateless, which is why
it survives review. Add the key when you write the list, not when something breaks, and check
that the id you key on is unique before you trust it.

## Receipts
- `feature/agent/src/commonMain/kotlin/com/mileway/feature/agent/ui/screens/AgentChatScreen.kt` line 515: `items(messages)` with no key.
- `feature/agent/src/commonMain/kotlin/com/mileway/feature/agent/model/AgentModels.kt`: `AgentMessage.id` defaults to `"u_" or "a_"` plus `timestampMs`.
- `feature/agent/.../viewmodel/AgentContract.kt` line 26 and `AgentViewModel.kt` line 249: feedback is a `Map<String, Int>` keyed by `message.id`, outside the row.
- `feature/agent/.../ui/components/AgentComponents.kt`: `AgentMessageBubble` contains no `remember`.
- Contrast: `feature/cards/.../CardsHomeScreen.kt` line 140, `items(cards, key = { it.id })`.
- Not claimed: that this list has ever misbehaved. It hasn't that I know of. Compose behaviour (position as default key, throw on duplicate key) is from the Compose docs.

## Lore
The Recomposer, in a quieter mood. He isn't redrawing anything this time. He's waiting for the
list to reorder. Series: Ghosts in the Recomposition, iteration 21.
