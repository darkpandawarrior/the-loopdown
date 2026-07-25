# Reply to Alex (Concussed Witness post)

## His comment
> The most important part is not rejecting one absurd value; it is carrying confidence and
> provenance with every reading. Once downstream logic sees only a coordinate, uncertainty has
> already been lost. The same principle applies to backend metrics: validate invariants,
> correlate independent signals, and degrade explicitly instead of trusting the latest datapoint.
> How did you tune the boundary between filtering real anomalies and deleting valid edge cases?

He is right, and he asked a sharp question. Answer it with the real system.

---

## THE REPLY (LinkedIn comment limit is 1,250 chars, this fits)

Alex, this is exactly right, and it is where we landed only after getting it wrong first.

Short answer: we stopped deleting things. That is how we dodged the boundary problem.

Only two cases drop outright, because they cannot be real: coordinates outside lat/lng range,
and accuracy under 0.1m or over 250m. Everything else is persisted and classified. Every row
keeps its accuracy, provider, bearing, altitude, gyro and accelerometer snapshot, battery and
device model. Distance splits into buckets: original, cleaned, abnormal, mock, spike. Filtered
never means gone. It means not counted toward the cleaned number, and here is why.

On the boundary itself:

Gates are speed banded, not global. 2m walking, 3m cycling, 5m driving. One global gate is what
deletes valid edge cases.

Caps are gap aware. Under 30s a 5km jump is a teleport. The cap relaxes by tier as the gap
grows, and past 6h a flat distance gate replaces the speed test.

A small step is only dropped when a rolling speed window shows no recent movement, so a traffic
crawl survives.

The accelerometer outranks GPS. If the IMU says still, we believe it over GPS speed.

The part I would push hardest: because nothing is deleted, the buckets became the tuning
instrument. We can replay real journeys and ask what we called abnormal and whether it truly
was. Delete the data and you can never answer that question.

---

## LONGER VERSION (if he replies again, or for a DM / follow-up post)

Everything above, plus the four things that did not fit:

**Confidence is a first-class number, not a vibe.** A live quality score (0-100) travels with the
session: penalties for mock location (-25), missing permission (-30), battery optimisation (-15),
power saver (-15), process killed (-20), restart (-20), GPS off (-20), plus an accuracy tier
penalty (<=15m free, <=35m -5, <=75m -10, worse -20), and a small bonus when the fix stream is
stable. So the UI can say "this journey was tracked in poor conditions" instead of silently
showing a number.

**The explicit carve-out for the valid edge case.** Poor accuracy normally stops a fix
contributing to distance. But if speed <= 0.1 m/s AND accuracy < 20m AND there is recent movement
history, it is allowed through. That is the "device is genuinely parked and reliably placed, not
drifting" case. Named, commented, tested. Every filter needs its documented exception.

**Invariants validated before submission.** `cleaned = total - (mock + abnormal)`, with spike
deliberately excluded because it is never folded into total. Plus warnings when mock or abnormal
exceeds 50% of total, when spike exceeds 30%, or when GPS distance and the odometer reading
diverge by more than 30%. That last one is your "correlate independent signals" point exactly:
the odometer is a genuinely independent witness.

**Degrade explicitly, all the way to the user.** This is mileage that becomes an expense claim.
We show original vs cleaned, list what was removed and why, and let the user decide whether the
abnormal segment is subtracted. You cannot silently rewrite someone's reimbursement.

And the honest bit: the thresholds live in a serialisable config object, not as constants, so
tuning is a config change rather than a release. We got the numbers wrong more than once. The
buckets are what let us find out.
