---
title: "The captain routes. The captain never rows."
slug: the-captain-never-rows
type: lesson
pillar: engineering-practice
project: AgentHarness
tags: [ai-assisted-development, orchestration, cost-engineering, tooling]
status: ready
created: 2026-09-02
live:
url_devto:
url_linkedin:
url_medium:
url_hashnode:
channels: [linkedin, devto, hashnode, medium]
series: notes-from-the-loop
cast: [the-fleet]
loop_iteration: 17
---

# The captain routes. The captain never rows.

## The hook
Primary: Two runs died on rate limits in the same week. Not because the work was too big, but
because the most expensive model in the fleet was doing the rowing.

Variants to A/B:
- I treated model tiers as a quality ladder. They are a set of roles.
- "Use the best model" is the most expensive wrong instinct in agent work.
- The orchestrator has one job and it is not the job.

## The insight
The natural instinct with model tiers is to read them as a quality ladder: a small one, a medium
one, a big one, so use the biggest you can afford. That framing is what burns a budget, because
it treats capability as the only axis and ignores volume entirely.

They are roles, not ranks. A mechanical transform, a rename, a lint sweep is a small-model job and
stays one no matter how important the surrounding project is. Bulk execution across many files is
a mid-tier job, and it is where nearly all real work lives. The largest model earns its price on
orchestration and judgement: deciding what the work is, splitting it, and ruling on ambiguity.

The failure mode is specific and it has a name. An orchestrator that starts doing the work itself
is a captain who picks up an oar, and the ship stops steering at exactly the moment the volume
arrives.

## The story / how it played out
I run a fleet of agents across my own tooling. Early on I wired the top-tier model as both the
planner and the executor, on the reasoning that the work mattered and I wanted the best output.

Two waves died on rate limits inside a single week. The work was not unusually large. The problem
was that every one of a few hundred mechanical steps went through the most expensive path
available, so the budget was gone long before the actual judgement calls arrived.

The fix was not a smaller model. It was one sentence, made mandatory in the orchestrator's prompt:
delegate execution, do not perform it. Not advisory phrasing. Not "prefer to delegate". A model
told to plan and execute will execute, because executing is the more concrete instruction and
concrete instructions win.

## The takeaway
Pick the cheapest tier that covers the work, and let the expensive one spend its whole budget on
deciding. Escalate one rung at a time, and only on verified failure or genuine spec ambiguity,
never on volume. Volume is the signal to go down a tier, not up.

Then say it out loud in the prompt, because "you are the orchestrator" does not imply "you do not
also do the work" to something built to be helpful.

## Receipts
- Two agent waves in one week died on rate limits with the top tier wired as executor.
- Fixed by making delegation mandatory wording in the orchestrator prompt rather than advisory.
- The rule now lives in the harness as: mechanical to the small tier, all volume execution to the
  middle tier, orchestration and judgement only at the top.

## Lore
The Fleet. A crew with ranks: a captain who routes and never rows, and workers who do the volume.
The captain's value is entirely in where it points. Mutiny, meaning letting the captain pick up an
oar, sinks the ship and the token budget in the same afternoon. Cousin to
[[the-borrowed-hand]], which is the single entity you grapple; the Fleet is what you command.
Series: Notes from the Loop, iteration 17. Sign-off: "filed from iteration 17 of the loop."
