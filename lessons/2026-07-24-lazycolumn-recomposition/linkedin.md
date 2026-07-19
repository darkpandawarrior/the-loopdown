<!-- LinkedIn adapt · human, no em dashes -->

Your LazyColumn is redrawing every visible row every time anything changes. Here is the one reason it usually happens.

You passed it a List.

Not a typo. A plain List is not a stable type to Compose. The compiler cannot prove the list did not change, so to be safe it assumes it might have, and it recomposes the rows that read it. Scroll, tap, update one item, and the whole visible set redraws.

Compose has a superpower called skipping. If it can prove a composable's inputs did not change, it skips the redraw entirely. Stability is how it proves that. Plain List, plain Map, and types from modules Compose cannot see are all treated as unstable, and unstable inputs cannot be skipped.

Two fixes, both cheap:

1. Pass a stable list. Use kotlinx.collections.immutable and hand it an ImmutableList or persistentListOf(...). Now Compose knows it cannot change under its feet, and skipping kicks in.

2. Give items a key. items(list, key = { it.id }) { }. Without keys, Compose tracks rows by position, so inserting or reordering redraws more than it should.

You can watch it happen. Turn on recomposition counts in Layout Inspector and scroll. Unstable list, and every row ticks up. Fix the type, and they go quiet.

The lesson underneath:

Compose is not slow. It is fast by default, as long as you let it prove what did not change. Most "Compose is janky" complaints are really "I handed it something it could not reason about."

What is the first thing you check when a Compose screen feels heavy?

#Android #JetpackCompose #Kotlin #AndroidDev #Performance
