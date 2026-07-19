<!-- LinkedIn adapt · human, no em dashes -->

Your Compose screen is still collecting data while the user is looking at a different app. You probably wrote one line that does it.

val state by viewModel.data.collectAsState()

collectAsState starts collecting the flow and never stops until the composable leaves the composition. Background the app, and the composition is still there. So the collection keeps running. The flow keeps emitting. Your ViewModel keeps doing work for a screen nobody is looking at.

On a location feed or a live price, that is real battery and data burned in the dark. It is also a source of subtle bugs, because state that updates off-screen can pile up and surprise you when the user comes back.

The fix is one word longer:

val state by viewModel.data.collectAsStateWithLifecycle()

This ties collection to the lifecycle. When the app drops below STARTED, collection stops. When the user comes back, it resumes. The upstream flow can go cold, the ViewModel can stop the work, and nobody pays for a screen that is not on screen.

It lives in androidx.lifecycle.runtime.compose. Make it your default. Reach for plain collectAsState only when you genuinely want collection to continue while hidden, which is rare and should be a deliberate choice, not an accident.

The lesson underneath:

Lifecycle awareness is not a nice-to-have you bolt on later. It is the difference between work that stops when the user leaves and work that quietly runs forever.

What is your default: collectAsState or collectAsStateWithLifecycle?

#Android #JetpackCompose #Kotlin #AndroidDev #Performance
