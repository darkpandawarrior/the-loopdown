<!-- LinkedIn adapt · human, no em dashes -->

Our GPS filter worked perfectly, right up until someone sat in Bangalore traffic.

Here is the setup. A parked phone does not sit still in the data. GPS wanders a few metres in every direction, and each wander looks like real distance. Left alone it adds phantom kilometres to a stationary car.

So you add a floor. Ignore any step under 5 metres. Parked cars stop drifting. Ship it.

Then a driver spends 40 minutes crawling through traffic at walking pace. Every genuine step they make lands under 5 metres. We deleted their entire journey and told them they had not moved.

The filter was not broken. The threshold was lying about what it knew. A single constant claims that 5 metres means the same thing whether you are parked, walking, cycling, or crawling in first gear. It does not.

What replaced it:

Speed bands. The gate matches how fast you are actually going. Under 2.5 m/s you get a 2 metre gate. Under 7 m/s, 3 metres. Driving, 5 metres.

Gap awareness. A big jump after a long silence is usually legitimate, not a glitch. Under 30 seconds a 5km jump is a teleport. As the gap grows, the cap relaxes by tier: 150 m/s within 5 minutes, 100 within an hour, 60 within six. Past six hours we stop testing speed entirely and use a flat distance gate. A tunnel, a killed process and a flight all look like a jump, and only one of them is a bug.

History. This is the one that actually saved the traffic case. A small step is only dropped when the last 5 readings average under 1.5 m/s. Sustained slow movement is movement. Real stillness is stillness. The window can tell them apart. A constant never could.

The lesson underneath:

When you write a constant into a filter, ask what context you are assuming. If the answer is all of them, you have not written a threshold. You have written a bug with a delay on it.

What is the most expensive magic number you have shipped?

#Android #Kotlin #SoftwareEngineering #DataEngineering #MobileEngineering
