---
title: The Loopdown — Pantheon
type: reference
status: living
created: 2026-08-02
---

# The Pantheon

`cast.md` is the roster: who is on stage now. This file is the rule underneath it, the one
that lets the roster change without the world resetting.

## Power and Aspect

Every entity is really two things.

**The Power** is the thing itself and it does not change. Cancellation is a Power. So is
recomposition. So is the one-way crossing of a schema. Powers are older than any API that
expresses them, and they will outlive the one expressing them now.

**The Aspect** is the face a Power wears in a particular era, named for the technology that
currently carries it. Aspects are mortal. When the substrate underneath a Power is replaced,
its Aspect dies and the Power takes a new name, keeping every trait that was true of it before.

This is the ordinary way pantheons work. Zeus and Jupiter are one Power and two Aspects, and
nobody thinks the thunder changed. Dream is Morpheus is Kai'ckul, one Endless with a name for
every culture that ever needed to ask him for something.

The Loopdown runs on the same rule, with one difference that matters: **here you can date the
rebirths, because they are in the changelog.** An Aspect dies on a specific API deprecation.

## Rebirth is not a retcon

When an Aspect dies, its stories stay true. The Inflater really did redraw the room you were
not looking at; it just did it by re-running `findViewById` inside a recycled `ViewHolder`
rather than by re-executing a composable. Same Power, same cruelty, different machinery.

So a post about a dead Aspect is not obsolete lore. It is *older canon*, and referring to it
is how a reader who has been around a while gets rewarded.

The rule for writing one: **never sneer at a dead Aspect.** It solved the problem with the
tools it had. Warmth, never contempt, applies across time as well as across characters.

## The succession list

| Power | Dead Aspect | Living Aspect | The rebirth |
|---|---|---|---|
| redrawing what nobody asked to change | **The Inflater** (`findViewById`, `ViewHolder` recycling) | **The Recomposer** (`@Composable`) | declarative UI replaced imperative inflation |
| the message everyone kills | **The Interrupt** (`Thread.interrupt()`, `AsyncTask.cancel`) | **The Messenger** (`CancellationException`) | cooperative cancellation replaced the flag nobody checked |
| the crossing that only goes one way | **The Upgrader** (`SQLiteOpenHelper.onUpgrade`) | **The Ferryman** (`Migration(23, 24)`) | Room made the crossing declarable, and no more reversible |
| guarding a key, including from you | **The Locksmith** (a constant in `SharedPreferences`) | **The Vault Keeper** (`AndroidKeyStore`) | hardware backing replaced hope |
| a witness who swears and is wrong | **The Surveyor** (`LocationManager`, `GPS_PROVIDER`) | **The Concussed Witness** (fused location) | fusion replaced a single confident source |
| the stand-in cast for one fixed role | *(none, it was born here)* | **The Understudy** (`actual`) | Kotlin Multiplatform had no ancestor to inherit from |
| reaching for something that is not you | *(none, and this is the point)* | **The Borrowed Hand** (`LlmGateway`) | the first Power acquired from outside himself |

Two entries in that table have no dead Aspect, and both are load-bearing. The Understudy is
new because the problem is new. The Borrowed Hand is new because *he* is, and it is the only
Power in the pantheon that did not grow out of a habit he already had.

## The rules for adding, killing, or renaming

1. **A Power is never invented, only recognised.** If you cannot name the failure it personifies
   in one sentence of real engineering, it is a mascot rather than an entity, and it does not go
   in.
2. **An Aspect dies only when its API does.** Deprecation is the death certificate. Not fashion,
   not a better metaphor turning up.
3. **The successor inherits every trait.** If the old Aspect was sympathetic and misread, so is
   the new one. Traits belong to the Power. Only the machinery belongs to the Aspect.
4. **A rebirth needs a dated cause.** "Compose replaced views" is a cause. "It felt stale" is not.
5. **Nothing is deleted.** A dead Aspect moves to the succession list above and keeps its posts.
   The canon is auditable and stays that way; see `bible.md` rule 3.
6. **One Power, one Aspect at a time.** If two names are alive for the same failure, one of them
   is a mascot. Pick.

## Why this exists

Because the roster will outlive the APIs on it. `expect/actual` will one day be the thing an
older engineer explains to a younger one, the way `AsyncTask` is now, and when that happens the
Understudy should be able to hand the role over rather than quietly vanish from the wall.

A pantheon that can bury its own names is the only kind that survives a long enough loop.

## The sigil

Every entity carries a mark, and nobody chose it.

`scripts/design-kit.mjs` exports `sigil(className, accent)`. It hashes the entity's **real class
name** with FNV-1a and derives the geometry from those bytes: vertex count, chord skip, ring
count, which vertices are filled. The radial ticks around the outside are one per character, so
the length of the API name is visible in the mark.

`CancellationException` produces exactly one figure and always will. So the sigil is not
decoration applied to the entity. It is the entity's own name written in another alphabet.

This gives the pantheon a property real pantheons only pretend to have: **rename the class and
the sigil changes.** When an Aspect dies and a Power is reborn, it cannot keep the old mark, because
the mark was never the Power's. It belonged to the Aspect, which is to say to the API, which is to
say to the era.

## Summoning

`scripts/summon.mjs` reads a Kotlin codebase and reports which of the cast are living in it.

```
node scripts/summon.mjs ~/Repos/Android/Mileway
node scripts/summon.mjs . --entity the-messenger
```

Each rule is a genuine failure mode the entity already personifies, so the character is not a
skin over a warning. The character **is** the warning, and was before the script existed. A hit
prints the entity's name, what it found, and a line in its own voice.

Every rule also declares its blind spot, out loud, in the output. These are regex heuristics over
text rather than a parsed AST: they surface candidates, never verdicts. That constraint is not an
apology, it is the house rule from `the-borrowed-hand` applied to the tool that reports on the
house rules. A checker that overstates its certainty is the thing it is checking for.
