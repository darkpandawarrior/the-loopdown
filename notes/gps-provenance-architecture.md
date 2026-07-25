# GPS confidence and provenance: the real architecture

Reference notes. Source of truth for the location-engineering story: LinkedIn replies, future
posts, interview answers. Everything here is verified against the actual code, with file paths
and real constants. Written 2026-07-20, triggered by Alex's comment on the Concussed Witness post.

**The one-line thesis:** the win was never "reject the 400 kmph reading". It was refusing to
delete anything, carrying provenance and confidence on every row, and splitting distance into
named buckets so a filtered value can always be audited and reversed.

---

## Where the code lives

### Mileway (KMP, current, the mature version)
| What | Path |
|---|---|
| `LocationProcessor`, `GpsFix`, `ProcessResult`, `TrackStats` | `feature/tracking/src/commonMain/.../service/location/TrackingPipeline.kt` |
| Invariant checker | `feature/tracking/src/commonMain/.../service/location/DistanceValidator.kt` |
| Tunable thresholds | `feature/tracking/src/commonMain/.../manager/AbnormalDetectionConfig.kt` |
| Hard gates / constants | `feature/tracking/src/commonMain/.../service/LocationTrackingConstants.kt` |
| Live confidence score | `external/kmp-toolkit/location/.../TrackingQualityScorer.kt` |
| Kalman smoothing | `external/kmp-toolkit/location/.../KalmanSmoother.kt` |
| Post-hoc analysis | `feature/tracking/src/commonMain/.../insights/` (SmartDistance, DistanceQuality, JourneyQuality, SystemImpact, Activity, Route analyzers) |
| Tests | `commonTest/.../service/location/`: TrackingPipelineAccuracy, KalmanSmoother, DistanceCalculator, DistanceValidator + `app/src/test/.../LocationProcessorTest.kt`, `TrackingQualityScorerTest.kt` |

Note: the location engine is extracted into **kmp-toolkit** (`com.siddharth.kmp.location`), so the
scorer and smoother are reusable, pure Kotlin, zero Android dependency, fully JVM-testable.

### Dice / androidAppSaaS (production, 50k MAU, where it was learned)
| What | Path |
|---|---|
| User-facing cleaned vs original + toggle | `app/.../composeUIKit/view/dialog/SmartDistanceBottomSheet.kt` |
| Irregularity disclosure | `app/.../composeUIKit/view/dialog/TripIrregularitiesDialog.kt` |
| Insight processing | `app/.../core/notifications/LocationInsightsProcessor.kt` |
| Hardware event classification | `app/.../mileageTracker/util/HardwareEventClassifier.kt` |
| Tracking service | `app/.../mileageTracker/MileageTrackingV2.kt`, `LocationTrackingService_Documentation.md` |

---

## The pipeline, in order (LocationProcessor.process)

### 1. Hard drops (the ONLY things deleted)
Two, both physically impossible:
- Coordinates outside range: lat not in -90..90, lng not in -180..180
- Accuracy `<= 0.1m` (impossibly precise) or `>= 250m` (hopelessly noisy)

`ACCURACY_MIN_M = 0.1f`, `ACCURACY_MAX_M = 250f`. Returns null. Nothing else is ever discarded.

### 2. Kalman smoothing before classification
`KalmanSmoother.smooth(lat, lng, accuracy, timeMs)` runs **first**, so distance and classification
both use the filtered position. Toggleable (`enableKalman`); off means byte-for-byte identical
behaviour to raw. Reset on journey start and on pause -> resume so stale state does not bleed in.

### 3. Soft accuracy gate (persist, do not count)
`MAX_ACCURACY_THRESHOLD_M = 50.0`. Above it the fix is **still persisted**, just excluded from
`cleanedDistance`. This is the core move: the data survives, the trust does not.

**The named exception:** `exceptionalStationary` = speed <= `0.1 m/s` AND accuracy < `20m` AND
`hasMovementHistory()`. Device is genuinely parked and reliably placed, not drifting, so it may
contribute even above the threshold. Every filter needs a documented carve-out.

### 4. Speed-banded jitter suppression (not one global gate)
`minDisplacementForSpeed(speed)`:

| Band | Speed | Min displacement to escape jitter |
|---|---|---|
| Walking | < 2.5 m/s | 2.0 m |
| Cycling | < 7.0 m/s | 3.0 m |
| Driving | >= 7.0 m/s | 5.0 m |

Plus a stationary micro-jitter rule: speed < `1.2 m/s` and displacement < `1.2m`.
User-set floor (`minDisplacementFloorM`) can only ever raise the gate.

**Crucially:** a sub-gate step is only dropped when `hasMovementHistory()` is false, i.e. the
rolling window of the last **5** fixes averages < `1.5 m/s`. That is what keeps a traffic crawl
alive. This is the single most important anti-"deleting valid edge cases" mechanism.

### 5. Independent signal correlation (IMU outranks GPS)
`motionStill` (accelerometer says physically still) or `harshAccel` (hard accel/brake this fix)
strengthen suppression, overriding the GPS-speed movement heuristic. Comment in the code:
*accelerometer stillness is authoritative*. A hard stop can momentarily look like "still" to a
speed gate, so it is treated with the same authority.

### 6. Abnormal classification, gap-aware tiers
`isAbnormal(displacement, impliedSpeed, dtSec)`:

| Time gap | Rule |
|---|---|
| < 30 s (normal sampling) | displacement > **5 km** = instant teleport, OR implied speed > **70 m/s** (~252 km/h) |
| <= 5 min | implied speed > 150 m/s |
| <= 1 h | implied speed > 100 m/s |
| <= 6 h | implied speed > 60 m/s |
| > 6 h | flat **10 km** displacement gate, speed test dropped entirely |

Why tiers: a long gap legitimately permits a big jump (tunnel, killed process, flight, phone off).
Rejecting on one global speed cap is precisely how you delete valid data.

Post-resume grace window (`suppressSpike`) accepts a large jump because the user moved while
paused, but **still enforces the accuracy gate**. Relaxing one rule never silently relaxes others.

### 7. The buckets (the whole point)
Every step's displacement lands in exactly one place:

- `originalDistanceM`: everything, always
- `mockDistanceM`: mock provider
- `abnormalDistanceM`: failed the tier test
- `spikeDistanceM`: hard-gate teleports (>5 km in normal sampling), tracked separately
- `cleanedDistanceM`: the trustworthy number
- plus `odometerDistance` where available

`consecutiveNormalCount` tracks a clean streak (resets on abnormal) so the service can reset the
anchor after 3 clean fixes.

### 8. Provenance on every persisted row (`LocationData`)
lat, lng, speed, **accuracy**, displacement, **isMock**, **isAbnormal**, isPaused, **provider**,
bearing, altitude, locationTime, batteryPercentage, gyroscopeX/Y/Z, accelerometerX/Y/Z,
**deviceModel**, appVersionName.

This is Alex's point made concrete: downstream never sees "only a coordinate". It sees the
coordinate plus how much to believe it, where it came from, what the device was doing, and what
we already decided about it.

---

## Confidence as a first-class number

`TrackingQualityScorer` (kmp-toolkit). Starts at 100, subtracts:

| Condition | Penalty |
|---|---|
| Permission missing | 30 |
| Mock location | 25 |
| App killed | 20 |
| Restarted | 20 |
| GPS off | 20 |
| Battery optimised | 15 |
| Power saver | 15 |

Accuracy tier: <=15m free, <=35m -5, <=75m -10, worse -20. Stable fix stream: +5. Clamped 0..100.

Live scorer (rates conditions as they happen for the notification/quality chip), distinct from the
post-hoc journey analysers. Pure, no Android, unit tested.

---

## Invariants, validated before submission

`DistanceValidator`. The relationship that must hold:

```
cleaned = total - (mock + abnormal)
```

Spike is **deliberately excluded** because it is never folded into total, so it is not subtracted
back out either. That subtlety is called out in a CRITICAL comment because it is exactly the kind
of thing a future refactor silently breaks.

Errors (block): negative distance in any field, component mismatch beyond 0.1 m tolerance,
cleaned > total.

Warnings (surface, do not block):
- mock or abnormal > **50%** of total
- spike > **30%** of (total + spike)
- **odometer vs GPS diverging > 30%** , the genuinely independent signal

---

## Degrade explicitly, all the way to the user

Dice `SmartDistanceBottomSheet` shows original vs cleaned, lists what was removed, and lets the
user **toggle** whether abnormal distance is subtracted (`if (removeAbnormal) final -= abnormal`).
`TripIrregularitiesDialog` lists Abnormal and Mock as labelled key-values, and explicitly marks
"app killed" as NOT an irregularity because the tracker recovers on its own.

This is mileage that becomes an expense reimbursement. Silently rewriting someone's number is not
a technical decision, it is a trust decision.

---

## Tuning: the actual answer to Alex's question

1. **Nothing is deleted, so the boundary is auditable.** The buckets are the tuning instrument.
   Replay real journeys, ask "what did we call abnormal, and was it?" If you delete, that question
   is permanently unanswerable. This is the whole answer in one sentence.
2. **Thresholds are config, not constants.** `AbnormalDetectionConfig` is `@Serializable` and
   nested in `TrackingConfig`: debug settings today, server-driven later. Tuning is a config
   change, not a release. `DEFAULT` reproduces the old hardcoded values exactly, so the refactor
   was provably behaviour-neutral.
3. **Ratios are the alarm, not individual points.** If abnormal exceeds 50% of a real trip, the
   threshold is wrong, not the driver.
4. **Every filter gets a named exception** (exceptionalStationary), tested and commented.
5. **Relaxing one rule never relaxes the others** (grace window still enforces accuracy).

---

## Post ideas this unlocks

Alex's framing is better than my original post. Mine was "reject the absurd value"; his is "carry
confidence and provenance". The second is the more senior idea and should anchor the series.

1. **"Filtered should never mean deleted"** (strongest, do this next). The bucket architecture.
   Any system that discards data cannot tune its own filters. Applies to metrics, fraud scoring,
   observability, ML pipelines. Cast: The Concussed Witness returns.
2. **"Your data model is where uncertainty goes to die."** The moment a row is just lat/lng, the
   confidence is gone forever. Provenance columns as a design discipline.
3. **"One global threshold is how you delete valid data."** Speed-banded gates, gap-aware tiers,
   history-relative decisions. The general rule: thresholds should be relative to context, never
   absolute.
4. **"Trust the accelerometer over the GPS."** Independent signal correlation. When two sensors
   disagree, rank them by what they are actually good at.
5. **"Every filter needs a documented exception."** exceptionalStationary as the worked example.
   A filter with no carve-outs has not met production yet.
6. **"Invariants are cheap, silent corruption is not."** `cleaned = total - (mock + abnormal)`,
   validated before submit, warnings on suspicious ratios.
7. **"Never silently change a number someone gets paid on."** Explicit degradation, user-visible
   removals, user-controlled toggle. Ethics-of-filtering angle, very shareable.
8. **"Thresholds belong in config, not constants."** How to make tuning a config change and prove
   the refactor was behaviour-neutral.

## Interview framing (Lead level)

This is the strongest system-design story in the arsenal. Structure it as:
problem (confidently wrong sensor) -> naive fix (reject outliers) -> the failure of the naive fix
(you cannot tell a tunnel from a bug, and you have destroyed the evidence) -> the real design
(classify into buckets, carry provenance, score confidence, validate invariants, degrade
explicitly to the user) -> the result (50% to 95% accuracy) -> the meta-lesson (a system that
deletes what it rejects can never be tuned).

Ends on a principle, not a metric. That is what makes it a Lead answer rather than an SDE-2 one.
