<!-- LinkedIn adapt · human, no em dashes -->

Every tuning change needed a code review, a release and a week of store rollout. So we stopped tuning. That is the worst possible outcome and it took me too long to see it.

Our location pipeline had roughly eighteen magic numbers. Speed band boundaries. A jitter gate for each band. A stationary threshold. A rolling window size. A spike gate. Four time-gap tiers, each with its own speed cap. All of them const val, scattered through one large file.

Every single one was a guess. A reasonable, tested, informed guess, but a guess, and exactly the kind of thing you want to revisit once real journeys start arriving.

Here is what actually happened. Revisiting one meant editing code, getting a review, cutting a build, waiting for a store rollout. A week, minimum, to move a number by 0.5. So nobody moved it. Arguments about thresholds became opinion versus opinion, because gathering evidence cost more than the argument was worth.

Frozen numbers are not stable numbers. They are unexamined ones.

The fix was boring. One serialisable data class holding every threshold, defaults exactly equal to the old constants, injected into the processor.

data class AbnormalDetectionConfig(
    val walkingMaxMps: Double = 2.5,
    val walkingJitterM: Double = 2.0,
    val cyclingJitterM: Double = 3.0,
    val drivingJitterM: Double = 5.0,
    val speedHistorySize: Int = 5,
    val spikeHardGateM: Double = 5_000.0,
    // ...and the gap tiers
)

Two details made it work.

The defaults being identical to the old constants meant the refactor was provably behaviour neutral. Every existing test passed untouched. A pure move with no risk attached, which is the only kind of refactor that gets approved quickly.

And it staged. Debug settings could override the config that same day. Server driven config later became a change to where the object comes from, not to the algorithm. The processor still has no idea where its numbers originate, which is exactly right.

The lesson underneath:

Separate the algorithm from its parameters. A constant is for something that cannot change, like metres in a kilometre. A jitter threshold is a hypothesis, and hypotheses have to be cheap to revise or they quietly become dogma.

How long does it take you to change a threshold in production?

#SoftwareArchitecture #Kotlin #Android #Refactoring #Engineering
