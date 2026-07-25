<!-- LinkedIn adapt · human, no em dashes -->

The sensor knew how much to trust itself. Our database column did not have room for that, so we threw it away on the way in.

Every Android location arrives with more than a coordinate. It carries an accuracy radius in metres, the provider that produced it, a bearing, an altitude, a timestamp. The system is telling you, on every single reading, how much to believe it.

Our early table stored lat, lng, speed and time. The rest got dropped at the door, because it was not needed yet.

Then the useful questions started arriving and none of them could be answered. Was this journey tracked well or badly? Which readings were fused, and which were raw GPS from a phone in a basement? Was the device even moving when this arrived?

We were not missing an algorithm. We were missing columns.

That is where uncertainty usually dies. Not in the clever filtering code, but quietly at the schema, months before anyone needs it. Once a row is just lat and lng, no downstream consumer can ever recover that one fix was accurate to 4 metres and the next to 200. They are now the same fact.

The row we persist today carries the reading and its papers:

accuracy, provider, bearing, altitude, timestamp
battery level, device model, app version
the gyroscope and accelerometer snapshot
and our own verdicts: isMock, isAbnormal, isPaused, displacement

That last group matters as much as the sensor data. We store what we concluded right next to what we concluded it from, so a future reader can check our work.

On top sits a single confidence number, 0 to 100, with penalties for mock location, missing permission, battery optimisation, power saver, a killed process, GPS off, plus an accuracy tier. So the UI can say this journey was tracked in poor conditions rather than silently showing a figure.

The rule I would give past me:

Design the row to carry doubt. If a value can be wrong, the schema needs a place to say how wrong, where it came from, and what you already decided about it. Add those columns before you need them. You cannot backfill confidence you discarded at write time.

What does your schema quietly throw away?

#DataEngineering #SoftwareArchitecture #Android #Kotlin #DatabaseDesign
