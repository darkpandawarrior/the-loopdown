# Backlog — lesson ideas mined from real work

Each is a *hook + the lesson underneath*. Pull one, run `new-lesson.mjs`, write it in voice.
Status: 🟢 ready to write · 🟡 needs a detail check · 💤 someday

## Location / sensor engineering (Mileway)
- 🟢 **"Our app clocked a parked user at 400 km/h."** → dead reckoning + spike detection. *(shipped as the first lesson)*
- 🟢 **"The 5-second window that can crash your foreground service."** → `startForeground()` deadline, FGS types, the ANR if you miss it.
- 🟡 **"Doze mode is not your enemy. Your wakelocks are."** → surviving battery restrictions without draining 20%/hr.
- 🟡 **"A floating bubble saved our tracking accuracy."** → why a visible service beats a silent one on hostile OEMs.

## KMP / multiplatform (kmp-toolkit, PaymentsLab)
- 🟢 **"expect/actual is the wrong default. Here's the right one."** → interface + platform binding vs expect/actual; when each wins. (see kmp-boundaries)
- 🟢 **"I shared a ViewModel across iOS and Android. Here's what actually shared — and what didn't."**
- 🟡 **"Koin or Hilt for KMP? I picked the boring one."** → DI choice in a real multiplatform app.
- 🟡 **"A payments SDK has no room for 'probably'."** → modeling money, idempotency, retries in PaymentsLab.

## Compose (Dice — 92% Compose)
- 🟢 **"Your LazyColumn recomposes on every scroll. Here's the one-line reason."** → stability, `List` vs `ImmutableList`.
- 🟢 **"collectAsState is quietly leaking your coroutines."** → `collectAsStateWithLifecycle` and why it matters.
- 🟡 **"We cut UI dev friction 60% with a theme engine."** → design tokens, CompositionLocal, the build vs buy call.
- 💤 **"Compose compiler metrics told me my 'optimization' made it worse."**

## Room / security (Dice — SQLCipher, Keystore)
- 🟢 **"24 migrations in production and zero data-loss incidents. The rules."**
- 🟢 **"Encrypting a Room DB is easy. Not locking yourself out is the hard part."** → SQLCipher + Keystore + key rotation.
- 🟡 **"BiometricPrompt + CryptoObject: the auth most apps get subtly wrong."**

## Coroutines / Flow (the gotcha series — great for engagement)
- 🟢 **"CancellationException is not an error. Stop catching it."**
- 🟢 **"combine() emits fewer times than you think. Here's the counting rule."**
- 🟡 **"flowOn goes AFTER the operator. Everyone puts it in the wrong place once."**
- 🟡 **"SupervisorJob doesn't do what its name promises."**

## Build-in-public (PaymentsLab, Kursi, HireSignal)
- 🟢 **"I built a payments integration lab in 16 modules. Here's the module map."**
- 🟡 **"Commit 1 vs commit 400: what I'd tell past me."** → diary/timestamped format (see voice-profile structural habits).
- 💤 **"I gave my job search to an AI agent fleet. It found bugs in my resume."** → HireSignal / agent harness angle.

## AI-assisted engineering (the differentiator)
- 🟢 **"I code with a fleet of AI agents. Here's the routing rule that stopped them wasting tokens."** → Haiku/Sonnet/Opus roles.
- 🟡 **"An AI reviewer caught a race condition 3 humans missed. Here's the setup."**
- 💤 **"'Lazy senior dev' is a system prompt now. It ships less code and I ship fewer bugs."** → ponytail angle.

## Lead-track reflections (payload-heavy, low-frequency)
- 🟡 **"The jump from SDE-2 to Lead isn't more code. It's more *no*."**
- 💤 **"I own a platform with 50k MAU. The scariest part isn't the traffic."**
