<!-- LinkedIn adapt · human, no em dashes -->

GPS said the car was moving. The accelerometer said the phone had not twitched in ten minutes.

Only one of them was right, and it was not the confident one.

Stationary drift is the oldest problem in location tracking. A parked phone reports small movements, and sometimes the reported speed agrees with them, because the drift itself looks like motion. Sum those steps and a car that never left the car park has done three kilometres.

For a long time we tried to fix this by making the GPS check smarter. Better thresholds, tighter gates, more conditions. All of it was the same mistake: asking GPS whether GPS is right.

The unlock was a second sensor with a completely different failure mode. The accelerometer is bad at telling you where you are. It is excellent at telling you whether you moved.

So we ranked them. On the question of "are we moving", physical stillness wins. If the IMU says the device has not moved, that overrides the GPS speed reading and the wander is suppressed, no matter how confident the fix looked. We gave harsh braking the same authority, because a hard stop can look like stillness to a speed gate for a moment and deserves the same treatment.

Note that we did not rank them overall. GPS is still the only thing that knows where you are. The accelerometer just outranks it on one specific question.

The same trick shows up again at journey level, much cheaper. Compare total GPS distance against the vehicle odometer. Two independent measurements of one number. If they diverge by more than 30 percent, raise a warning instead of silently trusting whichever one you happened to compute.

The lesson underneath:

A lonely sensor can only be checked against itself, which means your filter is a guess about its own input. Do not build a smarter threshold on it. Find a second signal that fails differently, and give it authority over the question it is genuinely good at.

Correlation beats cleverness.

What is the second signal in your system that nobody is using yet?

#Android #SensorFusion #Kotlin #MobileEngineering #SoftwareEngineering
