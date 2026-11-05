<!-- LinkedIn adapt · human, no em dashes -->

The user pressed Pay, the spinner spun, the request timed out. Did you charge them? If the honest answer is "probably not", something is wrong.

"The request failed" and "the charge didn't happen" are different statements. The gap is where double charges live. Make retrying safe by construction.

In PaymentsLab-KMP the order request has no amount. The server resolves price from the catalog item. It does carry an idempotency key, minted once per logical attempt, and the ViewModel owns it:
- Pay fails: key stays, so pressing Pay again is the same attempt.
- Pay succeeds: key cleared, the next press is a new purchase.
- Product or gateway changes: key reset, it's a different order.

The server writes the order, then putIfAbsent on the key. A test fires eight concurrent createOrder calls with one key and asserts exactly one order id. Split payments derive per-leg keys too.

All of it lives in commonMain. One brain decides what "same attempt" means on every platform.

Limits: the backend is in-memory, so dedup is process-local, and I haven't traced a retry after a hard decline.

"Probably not charged" isn't a state a payments client can be in.

How does your client know it's the same attempt?

#Kotlin #KMP #Payments
