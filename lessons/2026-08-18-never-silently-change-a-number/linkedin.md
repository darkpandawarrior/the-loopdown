<!-- LinkedIn adapt · human, no em dashes -->

Our algorithm decided a driver had travelled 4km less than they thought. It was probably right. Shipping that silently would still have been wrong.

Mileage tracking ends in an expense claim. Someone drives, the app measures, and that number becomes money. Our pipeline removes GPS spikes, distance from mock location apps, and physically implausible jumps. The cleaned figure is genuinely more accurate than the raw one.

So the obvious move is to show the cleaned figure. It is the best number we have.

It is also the move that loses you the argument.

Put yourself on the other side. You believe you drove 40km. The app says 36. You have no way to tell the difference between a good algorithm and a company quietly shaving your expenses. Being correct does not help when the only thing the user can see is a smaller number and a shrug.

Filtering stopped being a technical decision the moment the output became someone's reimbursement.

So we show the working:

The trip shows the original distance next to the cleaned one.
It lists what was removed and which category it fell into.
A diagnostics view names the abnormal and mock distance explicitly.
And the user can toggle whether the abnormal segment is actually subtracted.

That last one made some people uncomfortable. Why let a user overrule the algorithm? Because they were there and we were not. If our threshold is wrong, they are the only ones who can tell us, and the alternative is that they escalate to their finance team instead.

One detail I am fond of: an app-killed event is explicitly marked as not an irregularity, because the tracker recovers by itself. Disclosure only works if you are not crying wolf.

The lesson underneath:

When your output becomes an input to somebody's money, time, or reputation, correctness is table stakes and transparency is the product. Show the original, show the delta, show the reason, and let them push back.

Where does your system change a number without telling anyone?

#ProductEngineering #SoftwareEngineering #Android #UX #DataIntegrity
