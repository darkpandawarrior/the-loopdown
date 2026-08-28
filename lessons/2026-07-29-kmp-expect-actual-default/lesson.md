---
title: "expect/actual is the wrong default in KMP"
slug: kmp-expect-actual-default
type: lesson
pillar: kmp
project: PaymentsLab
tags: [kotlin, kmp, multiplatform, architecture, expect-actual, di]
status: ready
created: 2026-07-29
channels: [linkedin, devto, hashnode, medium]
series: one-brain-two-bodies
cast: [the-understudy]
loop_iteration: 5
---

# expect/actual is the wrong default in KMP

## The hook
Primary: Every KMP tutorial teaches expect/actual first. Then people use it for everything, and their shared code turns into a knot.

Variants to A/B:
- expect/actual is a compile-time weld. You cannot fake it, swap it, or test it.
- The KMP question is not "how do I reach the platform." It is "what do I hand in."
- An interface in common beats expect/actual almost every time. Here is when it does not.

## The insight
expect/actual binds a common declaration to exactly one platform implementation, chosen by
the compiler by name. That means you cannot inject a fake, cannot hold two
implementations, and cannot test the common code in isolation. For anything that varies or
needs a test, define an interface in common and inject platform implementations through a
constructor or DI. Save expect/actual for the small, fixed, one-per-platform joints.

## The story / how it played out
Early PaymentsLab common code used expect/actual for everything that touched a platform:
storage, clipboard, an http client. It compiled and ran. Then I tried to unit-test a use
case in commonTest and could not, because the expect declarations had no test actual, and
faking them meant adding a whole extra source set just to lie to the compiler.

Rewriting those as interfaces in common, with implementations injected, made the same code
testable in one line with a fake. The platform bodies stayed the same. Only the seam
changed.

expect/actual earned its place in exactly one spot: a type alias to a platform type that
genuinely has one meaning per platform and never needs a stand-in.

## The takeaway
Reach for the tool that keeps your options open. Interfaces and injection compose and
test. expect/actual welds. Use the weld only where you truly want one permanent joint.

## Receipts
- PaymentsLab: full KMP, Koin for DI, Ktor for networking.
- Moving platform seams from expect/actual to injected interfaces made commonTest real.
- Kept expect/actual for a small number of genuine one-per-platform declarations.

## Lore
The Understudy debuts here. A platform actual that steps on stage when the curtain rises,
cast by name at compile time. Great for a small fixed role. But for anything that changes
or needs rehearsal, you want a real actor you can swap, not a permanent understudy. Series:
One Brain, Two Bodies, iteration 5. Sign-off: "filed from iteration 5 of the loop."
