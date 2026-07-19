<!-- LinkedIn adapt · human, no em dashes · passes lint-voice + ship checklist -->

"Your app says I hit 400 kmph. I was at a red light."

Got that bug report on a Tuesday. The user wasn't lying. Neither was the app. The phone genuinely believed it, and that's the fun part.

Quick one on why your GPS lies, and what we did about it.

Think of GPS as a witness with a concussion. Confident, cooperative, often wrong. Drive into a tunnel and it just keeps reporting the last spot it saw for about 40 seconds. Then you come out, it snaps to your real position in one jump, and the math (big jump, tiny time) turns a parked car into a fighter jet.

We build mileage tracking. Trip accuracy isn't a feature, it's the whole product. Ours sat around 50 percent, and almost every missing point was a moment the phone lied with full confidence.

Three things took us from 50 to 95:

1. Catch the liars. If a reading needs you to accelerate like a rocket, it's fake. Drop it before it touches your data. This one guard killed the 400 kmph report on its own.

2. Dead reckoning. When GPS goes dark, stop waiting. Estimate your position from the accelerometer and your last good heading, the way old sailors navigated by feel with no stars. It drifts, so you don't lean on it long. But it carries you through the tunnel.

3. Fuse, don't pick. Weigh every signal by how much you trust it right now, instead of blindly taking whoever spoke last. Clean GPS pulls hard. Jittery GPS gets outvoted.

The part that stuck with me:

Good systems aren't the ones with perfect inputs. Nobody gets perfect inputs. Good systems assume their inputs will lie, and plan for the day they do.

Trust, but verify. Especially your own sensors.

Ever had a metric or signal you learned the hard way not to believe? Tell me below.

#Android #MobileEngineering #Kotlin #SystemDesign #SoftwareEngineering
