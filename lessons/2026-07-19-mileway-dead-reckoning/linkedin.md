<!-- LinkedIn adapt · ~1180 chars · hook + payload + CTA + hashtags · passes ship checklist -->

Our app once clocked a user — sitting dead still at a red light — doing 400 km/h.

The phone wasn't lying to be difficult. It was just... concussed.

Here's the thing nobody tells you about GPS: it's not a source of truth. It's a witness with a head injury. In a tunnel it repeats the last thing it saw for 40 seconds, then *teleports* to catch up (that's your 400 km/h). Off a glass tower, it swears you're two streets over.

Mileage tracking lives or dies on this. Ours started at ~50% accuracy. We got it to 95% — not with a better sensor, but by teaching the software when to stop trusting the one it had:

▸ Spike detection — if a fix implies impossible acceleration, the fix is a liar. Reject it.
▸ Predictive dead reckoning — when GPS drops, estimate position from motion sensors. The phone navigates like a sailor with no stars. Briefly. But well enough to bridge the gap.
▸ Sensor fusion — blend inputs by confidence, not by whoever spoke last. Good GPS pulls hard; bad GPS gets outvoted.

The lesson that stuck with me:

The most reliable systems aren't the ones with the best inputs. They're the ones that model how their inputs fail — and degrade gracefully when they do.

Trust, but verify. Even your own sensors.

What's a signal your system learned to *distrust*? 👇

#Android #MobileEngineering #SoftwareEngineering #Kotlin #SystemDesign
