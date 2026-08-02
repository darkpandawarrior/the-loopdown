# Backlog — lesson ideas mined from real work

Each is a *hook + the lesson underneath*. Pull one, run `new-lesson.mjs`, write it in voice.
Status: 🟢 ready to write · 🟡 needs a detail check · 💤 someday

## ⭐ Provenance & confidence (the richest vein — see notes/gps-provenance-architecture.md)

Came out of Alex's comment on post 001. His framing beats my original: the lesson is not
"reject the absurd value", it is "carry confidence and provenance with every reading".
That is the more senior idea and it should anchor the whole location series. All of these
are backed by real Mileway/Dice code with verified constants in the notes doc.

- 🟢 **"Filtered should never mean deleted."** ← do this next, strongest of the lot.
  The bucket architecture: original / cleaned / abnormal / mock / spike. A system that
  discards what it rejects can never tune its own filters. Generalises to metrics, fraud
  scoring, observability, ML pipelines. The Concussed Witness returns.
- 🟢 **"Your data model is where uncertainty goes to die."** The moment a row is just
  lat/lng, confidence is gone forever. Provenance columns as a design discipline.
- 🟢 **"One global threshold is how you delete valid data."** Speed-banded gates (2m walking,
  3m cycling, 5m driving), gap-aware tiers, history-relative decisions. Thresholds should be
  relative to context, never absolute.
- 🟡 **"Trust the accelerometer over the GPS."** Independent signal correlation. When two
  sensors disagree, rank them by what each is actually good at.
- 🟡 **"Every filter needs a documented exception."** exceptionalStationary as the worked
  example. A filter with no carve-outs has not met production yet.
- 🟡 **"Invariants are cheap. Silent corruption is not."** cleaned = total - (mock + abnormal),
  validated before submit, warnings on suspicious ratios, odometer cross-check.
- 🟢 **"Never silently change a number someone gets paid on."** Explicit degradation, visible
  removals, user-controlled toggle. Ethics-of-filtering angle, very shareable.
- 🟡 **"Thresholds belong in config, not constants."** Making tuning a config change, and
  proving the refactor was behaviour-neutral.

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

## From the shared dream (2026-08-02) — raw, see private/the-shared-dream.md
- 🟢 **"works for the demo. add key when it actually changes."** → `remember { }` with no key
  subscribes once and never resubscribes. The scope you skipped and the scope you remember
  building look identical from outside, and nothing in Compose tells you which one you are
  standing in front of. The Architect.
- 🟢 **"You added one item and the whole list forgot itself."** → `LazyColumn` without
  `key = { it.id }` falls back to positional identity, so an insert discards remembered state
  for everything below it. Five characters, not a rewrite. The Architect.
- 🟡 **"PRAGMA user_version reads 1 and no migration ever claimed credit."** → the seed database
  nobody wrote a CREATE for. Where does version 1 come from, and what happens on a device that
  installed before your first migration existed. The Ferryman.
