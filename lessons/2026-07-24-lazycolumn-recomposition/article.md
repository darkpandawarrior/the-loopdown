---
title: "Your LazyColumn Recomposes on Every Scroll"
canonical: the-loopdown/lessons/2026-07-24-lazycolumn-recomposition
tags: [android, jetpackcompose, kotlin, performance]
cover: assets/card.png
---

A feed screen felt heavy while scrolling, only on mid-range phones. Layout Inspector told
the whole story: every visible row was recomposing on every scroll frame, including rows
whose data had not changed at all.

There was a ghost in the recomposition, and it had one cause.

## Compose can skip, if you let it

Compose has a quiet superpower called skipping. When a composable's inputs have not
changed, Compose skips re-running it entirely. That is most of why it is fast.

Skipping depends on stability. To skip a composable, Compose has to prove its parameters
did not change. Some types make that proof easy. Others make it impossible.

A plain `List` is one of the impossible ones. `List` is an interface. The thing behind it
could be a mutable list that changed under Compose's feet, and the compiler cannot rule
that out. So Compose treats every `List` parameter as unstable, assumes it might have
changed, and recomposes the rows that read it. On a scrolling feed, that means redrawing
everything you can see, constantly.

## The fix is the type

```kotlin
// before: List is unstable, rows cannot skip
@Composable fun Feed(items: List<Post>) { ... }

// after: an immutable list is stable, skipping works
@Composable fun Feed(items: ImmutableList<Post>) { ... }
```

Use `kotlinx.collections.immutable` and build the list with `persistentListOf(...)` or
`.toImmutableList()`. Now Compose knows the collection cannot change, and it skips rows
whose data is unchanged.

While you are there, give the items a key:

```kotlin
LazyColumn {
    items(items, key = { it.id }) { post -> PostRow(post) }
}
```

Without keys, Compose tracks rows by position. Insert one at the top and every row below
shifts identity, so more of them redraw than needed. A stable key ties a row to its data.

## See it for yourself

Turn on recomposition counts in Layout Inspector and scroll. With an unstable list, the
counter on every row climbs. Switch to an immutable list and add keys, and the counters go
still. That stillness is the whole point.

## The takeaway

Compose is not slow. It is fast by default. Almost every "Compose is janky" story is
really the same story: someone handed a composable a type it could not reason about, so it
stopped skipping and started repainting the house.

The Recomposer only redraws the room when you give it a reason. Stop giving it reasons.
