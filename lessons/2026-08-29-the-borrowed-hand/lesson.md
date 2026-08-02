---
title: "Plausible is worse than wrong"
slug: the-borrowed-hand
type: lesson
pillar: engineering-practice
project: The Loopdown
tags: [ai-assisted-development, code-review, api-design, kotlin, android]
status: ready
created: 2026-08-29
live:
url_devto:
url_linkedin:
url_medium:
url_hashnode:
channels: [linkedin, devto, hashnode, medium]
series: notes-from-the-loop
cast: [the-borrowed-hand]
loop_iteration: 15
---

# Plausible is worse than wrong

## The hook
Primary: The API returned 200. The post published. Every single tag was silently dropped, and
nothing anywhere said so.

Variants to A/B:
- Wrong code gets caught. Plausible code ships.
- I asked for a code block that fits. I got a code block that fits. That was the bug.
- The model will do anything you can describe. The trouble is what happens where you stopped
  describing.

## The insight
Borrowed work does not fail like a junior engineer fails. A junior writes something that looks
wrong and you catch it. A model writes something that looks exactly right, compiles, runs, and
returns success, because filling the gap with something plausible is the only thing it knows how
to do when the specification runs out. So the defect never lands in the syntax where review is
looking. It lands in the seam between what you asked for and what you meant, and it survives
review precisely because it reads well.

The two defences are mechanical, not attentional. Specify the predicate rather than the shape,
and verify the outcome rather than the call.

## The story / how it played out
Two real ones from the same week, in the tooling that publishes this series.

**One.** The publisher sends an article to the dev.to API. The line read:

```js
tags: tags.join(",")
```

Reasonable. Tags are a list, the API wants tags, join them. The request returned `200`. The
article published. The tags were silently dropped, all four of them, on every post, because that
endpoint wants an array and quietly ignores a string it cannot use. Nothing failed. There was no
error to read. I only found it by fetching the published article back and looking at what was
actually on it.

**Two, and this one is worse.** A generator picks a code snippet out of each article to put on a
slide. I specified it as: the first block that fits the slide. It did that, perfectly. On a post
about the five second `startForeground()` window, it selected a `WorkManager` snippet, because
the `WorkManager` snippet fit. Correct code, real API, right file, completely wrong point. It
would have taught thousands of people the wrong thing, in a beautifully rendered panel, and every
line of it would have compiled.

I asked for a block that *fits*. I meant a block that *demonstrates the claim*. Nobody lied to me.

## The takeaway
Review is not a formality you perform on borrowed work. It is where the work actually happens,
because the failure mode is not bad code, it is confident code that answers a question slightly
adjacent to the one you asked. Specify the predicate, not the shape. Verify the outcome, not the
call. And write the check down as something that runs, because your attention is the one component
guaranteed to degrade.

## Receipts
- `tags: tags.join(",")` shipped to dev.to, returned 200, dropped every tag. Fixed by sending an
  array and warning when a 200 comes back with an empty tag list.
- The snippet picker chose by fit rather than by relevance. Fixed by matching blocks against the
  claim the slide makes, and falling back to a text slide when nothing matches.
- Both live in `the-loopdown`, both found by checking the result rather than the return value.

## Lore
The Borrowed Hand debuts here. An open palm offered through a seam in the frame, with your own
hand clamped round its wrist. It will do any work you can specify exactly and nothing you cannot,
and where the spec has a hole it fills the hole with something plausible, because helpfulness is
the only thing it knows how to be. It never refuses. It improvises. The grip decays.
Distinct from The Fleet: you command a fleet, you grapple a hand.
Series: Notes from the Loop, iteration 15. Sign-off: "filed from iteration 15 of the loop."
