<!-- LinkedIn adapt · human, no em dashes -->

Adding a payment gateway to my app is one line. I'm proud of that line. Then I went looking for what happens when someone adds the same gateway twice.

PaymentsLab-KMP has one PaymentGateway contract. Each provider module binds itself into Koin, and the registry is built from whatever turned up: DefaultPaymentGatewayRegistry(getAll<PaymentGateway>()). Features see only the interface, so provider N+1 touches no existing code. (70 when I counted on 2026-09-07, so the next is 71.)

The registry then does this: gateways.associateBy { it.id }.

associateBy keeps the last element when two share a key. If two modules contribute the same GatewayId, lookup by id returns the last one, the list still holds both, and nothing throws.

I searched the registry code and tests for a duplicate-id check. Nothing. I am not saying a duplicate exists, only that nothing could tell me.

That's the price of auto-discovery. The container assembles the list, so no human reads all of it, and any rule over the whole list has nowhere natural to live.

One line fixes it: require(gateways.map { it.id }.distinct().size == gateways.size). It fails at startup, not mid-payment.

Where does your DI assemble a list nobody reads?

#Kotlin #KMP #Koin
