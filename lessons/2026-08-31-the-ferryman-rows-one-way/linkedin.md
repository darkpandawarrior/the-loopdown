<!-- LinkedIn adapt · human, no em dashes · passes lint-voice + ship checklist -->

Forty-seven schema migrations in one app. Fifteen with a test behind them.

I would have told you, confidently, that it was fine. I had been quoting the migration count as a strength.

A migration is the only code you ship that gets exactly one attempt.

Everything else has a second chance. A bad screen gets a hotfix. A failed request gets retried. A crash gets a patch release and an apologetic changelog. A migration runs once, on a device you cannot see, against data you cannot reproduce. If it is wrong the data is not broken, it is gone, and the row you would need to recover from is the one that did not survive.

It is still routinely the least tested code in the codebase, because it looks trivial. One ALTER TABLE. Ship it.

So I ran an audit this week and sorted the untested ones by what they actually touch. That sort is the whole point, because migrations are not uniformly dangerous:

Foreign key changes (two of them). SQLite cannot alter a constraint in place, so the table gets recreated and every row copied across. That copy is a full data movement wearing the costume of a schema tweak.

A data-moving migration, INSERT INTO ... SELECT. This one does not change shape, it transforms content. A mismatched column order loses no rows at all, which is exactly what makes it the worst case: a full table of confidently wrong values, and no error anywhere.

A DROP. Irreversible by construction.

Four migrations out of thirty-five untested ones. That is the actual risk surface. Test those and you buy most of the available safety for a fraction of the work.

Coverage percentage is the wrong instrument here. Sort by what it touches.

Two things that make all of it possible:

Export your schemas (room.schemaLocation) and commit them. Without an old schema there is nothing to migrate from, so there is no test to write, and the audit cannot even start.

And assert the data, not just the schema. runMigrationsAndValidate proves the table has the right shape. Only reading a row back proves anything survived.

I did not find a bug this week. I found thirty-five crossings I had never rehearsed. The uncomfortable part is that forty-seven migrations sounds like maturity, and it is only maturity if you can say what happens when each one runs.

The boat only rows one way.

How do you test yours?

Filed from iteration 16 of the loop.

#Android #Kotlin #Room #Testing #SoftwareEngineering
