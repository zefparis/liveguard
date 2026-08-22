# LiveGuard

Session verification via 5 cognitive challenges. No camera, no microphone.

## Stack

React 18 + Vite 6 + TypeScript + CSS vanilla (no Tailwind, no UI kit).

## Flow

```
idle → select_protection → prep → test_reflex → test_colors → test_memory → test_compare → test_path → review → device_signals → readiness → submitting → done
```

## Origin

LiveGuard is a clone of [demoguard](https://github.com/zefparis/demoguard) with vocal and camera removed. The cognitive engine (reducer, scoring, collectors) is cloned as-is — only the vocal/camera layers were stripped.

## File inventory

### Cloned as-is (no modification beyond rename)

| File | Role |
|---|---|
| `src/liveguard/cognitive/reflexChallenge.ts` | Reflex test logic |
| `src/liveguard/cognitive/stroopChallenge.ts` | Stroop test logic |
| `src/liveguard/cognitive/digitSpanChallenge.ts` | Digit Span test logic |
| `src/liveguard/cognitive/nBackChallenge.ts` | N-Back test logic |
| `src/liveguard/cognitive/trailTapChallenge.ts` | Trail Tap test logic |
| `src/liveguard/cognitive/brainAge.ts` | Brain age estimation |
| `src/liveguard/behavior/*.ts` | Behavior recording (touch, timing) |
| `src/liveguard/collectors/deviceCollector.ts` | Device metadata |
| `src/liveguard/collectors/motionCollector.ts` | Motion sensor |
| `src/liveguard/collectors/orientationCollector.ts` | Orientation sensor |
| `src/liveguard/collectors/networkCollector.ts` | Network info |
| `src/liveguard/collectors/permissionCollector.ts` | Permission states |
| `src/liveguard/collectors/phaseTracker.ts` | Phase tracking singleton |
| `src/liveguard/collectors/touchCollector.ts` | Touch dynamics |
| `src/liveguard/collectors/visibilityCollector.ts` | Visibility/focus |
| `src/liveguard/quality/deviceSignalQuality.ts` | Device signal quality |
| `src/hooks/useBehaviorSession.ts` | Behavior session hook |
| `src/hooks/useContinuousSignals.ts` | Continuous signal collection |
| `src/hooks/useLockedShell.ts` | Locked viewport |
| `src/components/ErrorBoundary.tsx` | Error boundary |
| `src/components/LanguagePill.tsx` | FR/EN switch |
| `src/components/PhaseHeader.tsx` | Progress header |
| `src/screens/PrepScreen.tsx` | Permissions screen |
| `src/screens/ReflexScreen.tsx` | Reflex UI |
| `src/screens/StroopScreen.tsx` | Stroop UI |
| `src/screens/DigitSpanScreen.tsx` | Digit Span UI |
| `src/screens/NBackScreen.tsx` | N-Back UI (includes HN fixes: trial 0 hint, no em-dash) |
| `src/screens/TrailTapScreen.tsx` | Trail Tap UI (includes HN fix: node centering) |
| `src/screens/DeviceSignalsScreen.tsx` | Device signals review |
| `src/screens/ReadinessScreen.tsx` | Final check |
| `src/screens/SubmittingScreen.tsx` | Submitting spinner |
| `src/screens/ErrorScreen.tsx` | Error screen |
| `api/liveguard/verify.ts` | Vercel proxy → hybrid-vector-api |
| `api/_lib/liveguardSanitize.ts` | Response sanitizer |

### Modified

| File | Changes |
|---|---|
| `src/liveguard/cognitive/cognitiveTypes.ts` | Removed `VocalRanSignal`, removed `vocal_ran` from `CognitiveSignals`, removed `'vocal_ran'` from `COGNITIVE_MODULE_NAMES` |
| `src/liveguard/cognitive/cognitiveScoring.ts` | Denominator 6→5, removed `vocal_ran` from modules array, removed "reflex + voice" depth branch |
| `src/liveguard/quality/signalCompleteness.ts` | Removed selfie/voice critical slots, removed voice-only scope, cognitive total 6→5 |
| `src/state/liveguardReducer.ts` | Removed `camera`/`voice` phases, removed `SELFIE_CAPTURED`/`VOICE_CAPTURED` actions, added `SELECT_PROTECTION` action, trail_tap always → review |
| `src/liveguard/types.ts` | Removed selfie/voice/vocal types, removed `VoiceDiagnosticsSafe`, removed `LiveGuardSensitive` |
| `src/liveguard/constants.ts` | Removed campaign domain, removed voice challenge path, added `LIVEGUARD_SESSION_ENDPOINT`, added `LIVEGUARD_PRODUCTION_URL` |
| `src/liveguard/api.ts` | Removed `requestVoiceChallenge()` |
| `src/payload/buildLiveGuardPayload.ts` | Removed selfie/voice/sensitive fields, removed `SensitiveRef` parameter |
| `src/payload/diagnosticsSafe.ts` | Removed `buildVoiceDiagnosticsSafe()`, kept only touch |
| `src/i18n/fr.json` | Removed voice/camera keys, added protection/done keys |
| `src/i18n/en.json` | Same as fr.json |
| `src/App.tsx` | Removed camera/voice screens, added SelectProtectionScreen, added header indicator, updated DoneScreen props |
| `src/screens/ReviewScreen.tsx` | Removed selfie/voice review sections |
| `index.html` | Replaced DemoGuard branding with LiveGuard |
| `src/index.css` | Replaced campaign palette with neutral palette + blue accent |

### New (not in demoguard)

| File | Role |
|---|---|
| `src/screens/SelectProtectionScreen.tsx` | Category selection (banking, crypto, custom) |
| `src/screens/IdleScreen.tsx` | Rewritten: shield icon, no-cam/mic message, session resolution via backend |
| `src/screens/DoneScreen.tsx` | Rewritten: green check, elapsed time, "Retour à l'application" |

### Deleted (present in demoguard, removed from LiveGuard)

| File | Reason |
|---|---|
| `src/screens/VoiceScreen.tsx` | Vocal removed |
| `src/screens/CameraScreen.tsx` | Camera removed |
| `src/demoguard/cognitive/vocalRanChallenge.ts` | Vocal removed |
| `src/demoguard/collectors/audioCollector.ts` | Audio only used by vocal |
| `src/demoguard/collectors/cameraCollector.ts` | Camera removed |
| `src/demoguard/quality/audioQuality.ts` | Audio removed |
| `src/demoguard/quality/selfieQuality.ts` | Selfie removed |
| `src/lib/audio.ts` | DSP utils for vocal only |
| `src/lib/camera.ts` | Camera utils |
| `src/lib/remote-vad-config.ts` | VAD config for vocal |
| `src/lib/vadRecorder.ts` | VAD recorder for vocal |
| `src/lib/vad-thresholds.ts` | VAD thresholds for vocal |
| `src/components/VadDebugOverlay.tsx` | VAD debug overlay |
| `src/components/FingerprintMotif.tsx` | DemoGuard campaign branding |
| `src/components/TestCard.tsx` | Unused legacy component |
| `api/demoguard/voice-challenge.ts` | Voice challenge proxy |
| `tests/audio.test.ts` | Audio tests |
| `tests/vadRecorder.test.ts` | VAD tests |
| `tests/buildDemoGuardPayload.test.ts` | Payload tests (selfie/voice) |
| `tests/cognitiveBattery.test.ts` | Battery tests (vocal_ran) |
| `tests/demoguardReducer.test.ts` | Reducer tests (selfie/voice) |
| `tests/qualityAssessors.test.ts` | Quality tests (audio/selfie) |
| `tests/i18n.test.ts` | i18n tests (vocal keys) |
| `tests/empirical-payload.test.ts` | Empirical payload (voice) |
| `tests/idleScreen.test.tsx` | Idle screen tests (campaign domain) |

## Session resolution

On start, `IdleScreen` POSTs to `LIVEGUARD_SESSION_ENDPOINT` (defaults to `https://hcs-u7-backend-kk0n.onrender.com/api/cognitive/liveguard/session`) with `{ source: 'liveguard' }`. On any failure, falls back to `lg_${timestamp}`.

**Justification for dedicated endpoint**: using `/api/cognitive/liveguard/session` instead of reusing `/api/cognitive/brain-age/session` keeps LiveGuard sessions distinguishable from DemoGuard campaign sessions in the `cognitive_sessions` table. The `source` field in the payload (`liveguard_mobile`) also differentiates them at the data level.

## Payload compatibility

The payload shape uses `demo_guard` as the wrapper key (same as demoguard) with `source: 'liveguard_mobile'`. This ensures compatibility with the existing Label Studio export pipeline (cognitive_sessions, project ID 3). The `signals.selfie` and `signals.voice` fields are `undefined` (absent from JSON), which the HV Zod schema accepts via `.optional()`.

## Build & test

```bash
npm install
npm run build      # → dist/
npx vitest run     # 70 tests
npx tsc --noEmit   # typecheck
```

## HN fixes preserved

All 3 UX fixes from Hacker News feedback are present:

1. **N-Back trial 0 hint** — first trial shows "This is the first letter — remember it" instead of ambiguous comparison (commit `ba8c395` in demoguard)
2. **No em-dash placeholder** — empty string when letter hidden, not `—` (commit `b913c1f`)
3. **Trail Tap node centering** — `transform: translate(-50%, -50%)` on `.trail-node` (commit `288000c`)

## License

Patents Pending FR2514274 | FR2514546
© 2026 Benjamin BARRERE / IA SOLUTION
