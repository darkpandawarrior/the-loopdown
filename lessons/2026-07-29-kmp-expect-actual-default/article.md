---
title: "expect/actual Is the Wrong Default in KMP"
canonical: the-loopdown/lessons/2026-07-29-kmp-expect-actual-default
tags: [kotlin, kmp, multiplatform, architecture]
cover: assets/card.png
---

Every Kotlin Multiplatform tutorial teaches `expect`/`actual` in the first ten minutes. It
is the headline feature, the thing that makes KMP feel like magic. So new teams learn it
first and then reach for it every single time common code needs to touch a platform.

That habit is how shared modules turn into a knot. `expect`/`actual` is a fine tool for a
narrow job, and the wrong default for most of them.

## What expect/actual actually is

It is a compile-time binding by name. You declare something in common:

```kotlin
// commonMain
expect class Clipboard() {
    fun copy(text: String)
}
```

and the compiler requires exactly one `actual` per platform:

```kotlin
// androidMain
actual class Clipboard actual constructor() {
    actual fun copy(text: String) { /* android impl */ }
}
```

The binding is fixed at build time. There is one `actual` for Android, one for iOS, and
the compiler wires them in. That sounds convenient, and for the right case it is.

## Where it hurts

The moment you want to do anything other than "one fixed body per platform," the weld
gets in the way.

- **You cannot inject a fake.** There is no test `actual`, so your common use case that
  depends on `Clipboard` cannot be tested in `commonTest` without inventing a whole extra
  source set to satisfy the compiler.
- **You cannot hold two implementations.** No real one and a fake one, no A/B, no decorator.
  The compiler picks one per platform and that is that.
- **Your common code is coupled to platform declarations,** one weld per concern, spread
  across storage, networking, clipboard, analytics, and everything else you reached for it
  with.

I lived this on PaymentsLab. Early common code used `expect`/`actual` for every platform
seam. It compiled and shipped. Then I sat down to unit-test a payment use case in
`commonTest` and simply could not, because the seams had no fakes.

## The better default: an interface, injected

```kotlin
// commonMain
interface Clipboard {
    fun copy(text: String)
}

class CopyReceiptUseCase(private val clipboard: Clipboard) {
    fun run(receipt: Receipt) = clipboard.copy(receipt.asText())
}
```

Provide the real thing per platform, and hand it in through your DI graph (Koin, in our
case):

```kotlin
// androidMain
class AndroidClipboard(private val ctx: Context) : Clipboard { /* ... */ }
```

```kotlin
// commonTest
class FakeClipboard : Clipboard {
    var last: String? = null
    override fun copy(text: String) { last = text }
}

@Test fun copies_receipt() {
    val fake = FakeClipboard()
    CopyReceiptUseCase(fake).run(receipt)
    assertEquals(expected, fake.last)
}
```

Same platform bodies. Same behavior. But now the common code depends on an interface it
owns, not on a platform declaration, and it is testable in one line.

## So when is expect/actual right?

For the small, fixed, one-per-platform joints where a stand-in makes no sense:

- A `typealias` to a platform type (`expect class Uuid`, actualized to the platform's UUID).
- A single top-level function with exactly one meaning per platform and nothing to test,
  like reading a platform constant.

Those are genuine welds. One joint, permanent, no reason to swap it.

## The takeaway

The KMP question is rarely "how do I reach the platform." It is "what do I hand my common
code." Hand it an interface it owns, and inject the platform body. Keep `expect`/`actual`
for the handful of places you actually want a weld.

The Understudy is perfect for a small fixed role, cast by name, on stage every night. Just
do not cast one for every part in the play.
