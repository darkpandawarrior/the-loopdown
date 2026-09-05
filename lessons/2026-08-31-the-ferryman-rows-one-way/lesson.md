---
title: "I audited my own migrations. It was not fine."
slug: the-ferryman-rows-one-way
type: lesson
pillar: data-integrity
project: Doori
tags: [android, room, migrations, testing, kotlin]
status: ready
created: 2026-08-31
live:
url_devto:
url_linkedin:
url_medium:
url_hashnode:
channels: [linkedin, devto, hashnode, medium]
series: crossing-the-schema
cast: [the-ferryman]
loop_iteration: 16
---

# I audited my own migrations. It was not fine.

## The hook
Primary: Forty-seven schema crossings in one app. Fifteen with a test behind them. I would have
told you, confidently, that it was fine.

Variants to A/B:
- A migration is the only code you ship that gets exactly one attempt on a stranger's phone.
- Room will happily run a migration you have never once executed against the schema it claims to upgrade.
- The dangerous migrations are not the complicated ones. They are the ones that touch a constraint.

## The insight
A migration is the single piece of code with no retry. It runs once, on a device you cannot see,
against data you cannot reproduce, and if it is wrong the user's data is gone rather than merely
broken. Yet it is routinely the least tested code in an Android codebase, because it *looks*
trivial: one ALTER TABLE, ship it. `MigrationTestHelper` exists precisely to run that statement
against a real pre-migration schema in a JVM-speed instrumentation test, and the reason to write
one is not coverage. It is that a migration is the only thing you cannot fix in the next release.

## The story / how it played out
I ran an audit across Mileway's database this week, expecting to feel good about it.

Forty-seven `Migration` objects. Current schema version 48. Eight test files covering fifteen
version pairs. So roughly two thirds of the crossings have never been executed against a real
snapshot of the schema they claim to upgrade.

Then I sorted the untested ones by what they actually touch, which is the part that mattered:

- **5 to 6** and **16 to 17**: foreign key changes. SQLite cannot alter a constraint in place, so
  Room's generated path recreates the table and copies rows across. That copy is where data goes.
- **32 to 33**: a data-moving migration, `INSERT INTO ... SELECT`. It does not just change shape,
  it transforms rows. A silently mismatched column order here loses nothing and corrupts everything.
- **47 to 48**: a `DROP`. Irreversible by construction.

Those four are not "low coverage". They are the entire risk surface, and they were sitting
underneath a number I had been quoting as a strength.

## The takeaway
Coverage percentage is the wrong instrument for migrations. Sort them by what they touch:
constraints, data movement, and drops. Test those first and you have bought almost all of the
safety for a fraction of the work. The rest is honest bookkeeping.

And be honest about which test you are writing. `MigrationTestHelper` builds the old version from
the schema Room actually exported. Hand-seeding it with a raw SQLite connection, which is what you
do when `exportSchema = false`, builds it from what you *remember* the old version looked like. Both
are real tests. Only one of them catches the day your memory and the schema stopped agreeing.

## Receipts
- Mileway: 47 `MIGRATION_x_y` objects, schema version 48, 8 androidTest files covering 15 pairs.
- Untested and structurally risky: 5->6 (FK), 16->17 (FK), 32->33 (data move), 47->48 (DROP).
- Dice, separately: 24 Room migrations across 2 databases (MileageDatabase 1..17, AccountDatabase 1..9).
- Mileway runs `exportSchema = false`, so its 8 existing tests hand-build the old schema with
  `BundledSQLiteDriver` rather than using `MigrationTestHelper`. The tests say so in their KDoc.

## Lore
The Ferryman. Rows you across the schema river, takes one payment, and only ever rows one way.
Pay the toll, which is the test, or the boat takes your data to the bottom. On dry ground it does
not exist, which is the point: nothing about a migration matters until the crossing begins, and by
then you cannot renegotiate. Series: Crossing the Schema, iteration 16.
Sign-off: "filed from iteration 16 of the loop."
