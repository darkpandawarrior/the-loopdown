<!-- LinkedIn adapt · human, no em dashes -->

I found a chat list in my own app with no key, and nothing was wrong with it. That's the bug.

Without a key, a LazyColumn identifies each item by its position. Harmless while the list only grows at the end and rows remember nothing. The moment you insert above, delete or reorder, every row after that point inherits a neighbour's identity and whatever state it remembered.

Most of Doori's lists pass key = { it.id }. The Agent chat screen does not: items(messages) { }, with an id right there on the model.

Broken? I checked. No, for lucky reasons. A chat only appends. And the bubble has no remember of its own: the thumbs up/down state lives in a map keyed by message id, hoisted out of the row. There's no state to swap.

The day someone adds an expanded flag, or "pin a message" reorders the list, the missing key starts to matter. Nothing would warn them.

And it isn't five characters. The message id is "u_" or "a_" plus a timestamp. Two messages from one side in the same millisecond would collide, and a keyed list throws on a duplicate key. Add the key and you inherit a latent crash.

Add the key when you write the list. Then check the id is actually unique.

What does your oldest list key on?

#JetpackCompose #Android #Kotlin
