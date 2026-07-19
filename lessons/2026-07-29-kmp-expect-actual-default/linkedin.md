<!-- LinkedIn adapt · human, no em dashes -->

Every KMP tutorial teaches expect/actual first. Then people use it for everything, and their shared code turns into a knot. It is the wrong default.

expect/actual lets you declare something in common code and provide a real version per platform. It feels like the KMP tool, so new teams reach for it every time common code needs to touch the platform: storage, clipboard, analytics, http, all of it.

Here is the problem. expect/actual is a compile-time binding by name. There is exactly one actual per platform, chosen by the compiler. You cannot swap it in a test. You cannot hold two implementations. You cannot inject a fake. Your common code is now welded to a specific platform declaration for every one of those concerns.

The better default is boring. An interface in common, implementations per platform, handed in through a constructor or your DI graph.

// common
interface Clipboard { fun copy(text: String) }

// androidMain, iosMain: real implementations
// commonTest: a fake, in one line

Now your shared logic depends on Clipboard, not on Android or iOS. You can fake it, swap it, and test it without a device.

So when is expect/actual actually right? For the small, fixed, one-per-platform things. A type alias to a platform type. A single declaration with exactly one meaning per platform and no need to test it. The genuine one permanent joint, not the moving parts.

The lesson underneath:

Reach for the tool that keeps your options open. Interfaces and injection compose and test. expect/actual welds. Use the weld only where you truly want one, permanent joint.

KMP folks, where do you draw the expect/actual line?

#KotlinMultiplatform #KMP #Kotlin #Android #MobileEngineering
