/**
 * LiveGuard — App.tsx (main orchestrator)
 *
 * Wires reducer + context + hooks + screens.
 * All phase transitions go through the reducer.
 *
 * Adapted from demoguard: removed camera and voice phases.
 * Flow: idle → select_protection → prep → 5 cognitive tests → review → device_signals → readiness → submitting → done
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useReducer, useCallback, useEffect, useState } from 'react';
import { liveguardReducer, initialState } from './state/liveguardReducer';
import { LiveGuardProvider } from './state/liveguardContext';
import { useBehaviorSession } from './hooks/useBehaviorSession';
import { useLockedShell } from './hooks/useLockedShell';
import { useContinuousSignals } from './hooks/useContinuousSignals';
import { useDesktop } from './hooks/useDesktop';
import { buildLiveGuardPayload } from './payload/buildLiveGuardPayload';
import { submitLiveGuard } from './liveguard/api';

import { IdleScreen } from './screens/IdleScreen';
import { LandingScreen } from './screens/LandingScreen';
import { LandingScreenDesktop } from './screens/LandingScreenDesktop';
import { HowItWorksScreen } from './screens/HowItWorksScreen';
import { HowItWorksScreenDesktop } from './screens/HowItWorksScreenDesktop';
import { LegalScreen } from './screens/LegalScreen';
import { ImplementationScreen } from './screens/ImplementationScreen';
import { SelectProtectionScreen } from './screens/SelectProtectionScreen';
import { PrepScreen } from './screens/PrepScreen';
import { ReflexScreen } from './screens/ReflexScreen';
import { StroopScreen } from './screens/StroopScreen';
import { DigitSpanScreen } from './screens/DigitSpanScreen';
import { NBackScreen } from './screens/NBackScreen';
import { TrailTapScreen } from './screens/TrailTapScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { DeviceSignalsScreen } from './screens/DeviceSignalsScreen';
import { ReadinessScreen } from './screens/ReadinessScreen';
import { SubmittingScreen } from './screens/SubmittingScreen';
import { DoneScreen } from './screens/DoneScreen';
import { ErrorScreen } from './screens/ErrorScreen';
import { ScenarioSelectorScreen } from './screens/ScenarioSelectorScreen';
import { ScenarioSelectorScreenDesktop } from './screens/ScenarioSelectorScreenDesktop';
import { SessionSuspendedScreen } from './screens/SessionSuspendedScreen';
import { SessionSuspendedScreenDesktop } from './screens/SessionSuspendedScreenDesktop';
import { CognitiveTestDesktopWrapper } from './components/CognitiveTestDesktopWrapper';
import type { SuspensionData } from './liveguard/behavior/telemetryTypes';
import { useI18n } from './i18n/I18nContext';
import {
  startBehaviorCollection,
  stopBehaviorCollection,
} from './liveguard/behavior/behaviorCollector';
import {
  startBehaviorBeacon,
  stopBehaviorBeacon,
  getOrCreateDeviceProfileId,
  collectDeviceContext as collectBeaconDeviceContext,
} from './liveguard/behavior/behaviorBeacon';

export default function App() {
  const { t } = useI18n();
  const [state, dispatch] = useReducer(liveguardReducer, initialState);
  const { session, reset, getPayload, getTouchDiagnostics } = useBehaviorSession();
  const { lockedHeight, showRotateOverlay } = useLockedShell(state.phase);
  const continuousSignals = useContinuousSignals();
  const isDesktop = useDesktop();

  // Track sessionPublicId from idle screen for select_protection
  const [pendingSessionId, setPendingSessionId] = useState<string>('');

  useEffect(() => {
    continuousSignals.setPhase(state.phase);
  }, [state.phase]);

  // ── Behavior beacon for real test parcours ──
  // Starts when the user enters the cognitive test phase (test_reflex) from
  // prep, with isDemo: false and the dedicated /test/ endpoint — so the server
  // knows with certainty this is a real test ping (not a demo ping).
  // Skipped for demo (protectionCategory === 'demo') and reverify sessions.
  // Stopped when the session ends (done, error, landing, reset).
  const isRealTestParcours =
    (state.protectionCategory !== 'demo' && state.protectionCategory !== 'reverify') &&
    (state.phase === 'test_reflex' || state.phase === 'test_colors' ||
     state.phase === 'test_memory' || state.phase === 'test_compare' ||
     state.phase === 'test_path' || state.phase === 'review' ||
     state.phase === 'device_signals' || state.phase === 'readiness' ||
     state.phase === 'submitting');

  useEffect(() => {
    if (isRealTestParcours && state.sessionPublicId) {
      const deviceProfileId = getOrCreateDeviceProfileId();
      const deviceContext = collectBeaconDeviceContext();
      startBehaviorCollection();
      startBehaviorBeacon(
        {
          intervalMs: 7000,
          sessionPublicId: state.sessionPublicId,
          source: 'liveguard',
          isDemo: false,
          deviceProfileId,
          deviceContext,
        },
      );
      return () => {
        stopBehaviorBeacon();
        stopBehaviorCollection();
      };
    }
  }, [isRealTestParcours, state.sessionPublicId]);

  // Deep links: /#how-it-works, /#implementation (old /#integration redirects to /#implementation)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#how-it-works') dispatch({ type: 'SHOW_HOW_IT_WORKS' });
    else if (hash === '#implementation' || hash === '#integration') dispatch({ type: 'SHOW_IMPLEMENTATION' });
  }, []);

  const handleStart = useCallback((sessionPublicId: string, _testScope?: string | null) => {
    setPendingSessionId(sessionPublicId);
    dispatch({ type: 'SELECT_PROTECTION', sessionPublicId });
  }, []);

  // Real test parcours → go to idle (session resolution) → select_protection → prep → tests
  // This is the path that triggers the behavior beacon with isDemo: false
  // and the consent screen in PrepScreen.
  const handleStartRealTest = useCallback((sessionPublicId: string) => {
    reset();
    dispatch({ type: 'START_DEMO', sessionPublicId });
  }, [reset]);

  const handleShowHowItWorks = useCallback(() => {
    dispatch({ type: 'SHOW_HOW_IT_WORKS' });
  }, []);

  const handleShowImplementation = useCallback(() => {
    dispatch({ type: 'SHOW_IMPLEMENTATION' });
  }, []);

  const handleBackToLanding = useCallback(() => {
    dispatch({ type: 'SHOW_LANDING' });
  }, []);

  const handleShowLegalTerms = useCallback(() => {
    dispatch({ type: 'SHOW_LEGAL_TERMS' });
  }, []);

  const handleShowLegalPrivacy = useCallback(() => {
    dispatch({ type: 'SHOW_LEGAL_PRIVACY' });
  }, []);

  const handleShowLegalCookies = useCallback(() => {
    dispatch({ type: 'SHOW_LEGAL_COOKIES' });
  }, []);

  const handleProtectionStart = useCallback((sessionPublicId: string, protectionCategory: string) => {
    reset();
    dispatch({ type: 'START', sessionPublicId, testScope: 'cognitive-only', protectionCategory });
  }, [reset]);

  const handleShowScenarios = useCallback((sessionPublicId: string) => {
    dispatch({ type: 'SHOW_SCENARIO_SELECTOR', sessionPublicId });
  }, []);

  const handleScenarioSuspended = useCallback((data: SuspensionData) => {
    dispatch({ type: 'SCENARIO_DEMO_SUSPENDED', reason: data.reason, suspensionData: data });
  }, []);

  const handleReverify = useCallback(() => {
    reset();
    dispatch({ type: 'START', sessionPublicId: state.sessionPublicId, testScope: 'cognitive-only', protectionCategory: 'reverify' });
  }, [reset, state.sessionPublicId]);

  const handleScenarioResume = useCallback(() => {
    dispatch({ type: 'SCENARIO_DEMO_RESUME' });
  }, []);

  const handleSubmit = useCallback(async () => {
    dispatch({ type: 'SUBMIT' });

    try {
      const deviceSignals = continuousSignals.stop();
      const behaviorPayload = getPayload();
      const behaviorDiag = getTouchDiagnostics();

      const stateWithSignals: typeof state = {
        ...state,
        signals: { ...state.signals, ...deviceSignals },
      };

      if (Object.keys(deviceSignals).length > 0) {
        dispatch({ type: 'DEVICE_SIGNALS_COLLECTED', signals: deviceSignals });
      }
      dispatch({ type: 'BEHAVIOR_COLLECTED', payload: behaviorPayload, touchDiag: behaviorDiag });

      const payload = buildLiveGuardPayload(stateWithSignals, behaviorPayload, behaviorDiag);
      const response = await submitLiveGuard(payload);
      dispatch({ type: 'RESPONSE_RECEIVED', response });
    } catch (err) {
      console.error('[LiveGuard] Submission failed:', err instanceof Error ? err.message : err, {
        sessionPublicId: state.sessionPublicId,
        phase: state.phase,
      });
      dispatch({ type: 'ERROR', reason: err instanceof Error ? err.message : 'Submission failed' });
    }
  }, [state, getPayload, getTouchDiagnostics, continuousSignals]);

  const handleReset = useCallback(() => {
    setPendingSessionId('');
    dispatch({ type: 'RESET' });
  }, []);

  const handleRetry = useCallback(() => {
    dispatch({ type: 'RETRY_PHASE' });
  }, []);

  const contextValue = {
    state,
    dispatch,
    behaviorSession: session,
  };

  const shellStyle = lockedHeight ? { height: `${lockedHeight}px` } : undefined;

  return (
    <LiveGuardProvider value={contextValue}>
      <div className="app-shell" style={shellStyle}>
        {showRotateOverlay && (
          <div className="rotate-overlay">
            <div>📱</div>
            <p>{t('app.rotatePortrait')}</p>
          </div>
        )}

        {/* Header indicator (shown on cognitive flow screens, not on landing/info pages) */}
        {state.phase !== 'idle' && state.phase !== 'landing'
          && state.phase !== 'how_it_works' && state.phase !== 'implementation'
          && state.phase !== 'scenario_selector' && state.phase !== 'scenario_demo'
          && state.phase !== 'session_suspended'
          && state.phase !== 'legal_terms' && state.phase !== 'legal_privacy'
          && state.phase !== 'legal_cookies' && (
          <div className="lg-header">
            <div className="lg-header-dot" />
            <span className="lg-header-text">Vérification de session</span>
            <button
              type="button"
              className="lg-header-back"
              onClick={handleBackToLanding}
            >
              ← {t('app.backToHome')}
            </button>
          </div>
        )}

        {state.phase === 'landing' && (
          isDesktop ? (
            <LandingScreenDesktop
              onShowHowItWorks={handleShowHowItWorks}
              onShowImplementation={handleShowImplementation}
              onShowScenarios={handleShowScenarios}
              onShowLegalTerms={handleShowLegalTerms}
              onShowLegalPrivacy={handleShowLegalPrivacy}
              onShowLegalCookies={handleShowLegalCookies}
              onStartRealTest={handleStartRealTest}
            />
          ) : (
            <LandingScreen
              onShowHowItWorks={handleShowHowItWorks}
              onShowImplementation={handleShowImplementation}
              onShowScenarios={handleShowScenarios}
              onStartRealTest={handleStartRealTest}
            />
          )
        )}

        {state.phase === 'how_it_works' && (
          isDesktop ? (
            <HowItWorksScreenDesktop
              onShowImplementation={handleShowImplementation}
              onShowScenarios={handleShowScenarios}
              onBackToLanding={handleBackToLanding}
              onStartRealTest={handleStartRealTest}
            />
          ) : (
            <HowItWorksScreen
              onShowImplementation={handleShowImplementation}
              onShowScenarios={handleShowScenarios}
              onBackToLanding={handleBackToLanding}
              onStartRealTest={handleStartRealTest}
            />
          )
        )}

        {state.phase === 'implementation' && (
          <ImplementationScreen
            onBack={handleBackToLanding}
            onBackToLanding={handleBackToLanding}
          />
        )}

        {state.phase === 'legal_terms' && (
          <LegalScreen section="terms" onBackToLanding={handleBackToLanding} />
        )}

        {state.phase === 'legal_privacy' && (
          <LegalScreen section="privacy" onBackToLanding={handleBackToLanding} />
        )}

        {state.phase === 'legal_cookies' && (
          <LegalScreen section="cookies" onBackToLanding={handleBackToLanding} />
        )}

        {state.phase === 'idle' && (
          <IdleScreen onStart={handleStart} />
        )}

        {state.phase === 'select_protection' && (
          <SelectProtectionScreen
            sessionPublicId={pendingSessionId}
            onStart={handleProtectionStart}
          />
        )}

        {state.phase === 'prep' && (
          <PrepScreen
            onDeviceCollected={(device) => dispatch({ type: 'DEVICE_COLLECTED', device })}
            onPermissionsCollected={(permissions) => dispatch({ type: 'PERMISSIONS_COLLECTED', permissions })}
            onUserContinue={async (perms) => {
              const sensorPerms = await continuousSignals.requestSensorPermissions({
                motion: perms.motion,
                orientation: perms.orientation,
              });
              await continuousSignals.start(sensorPerms);
            }}
            onReady={() => dispatch({ type: 'PREP_READY' })}
            onError={(reason) => dispatch({ type: 'ERROR', reason })}
            onShowLegalPrivacy={handleShowLegalPrivacy}
            skipConsent={state.protectionCategory === 'demo' || state.protectionCategory === 'reverify'}
          />
        )}

        {state.phase === 'test_reflex' && (
          isDesktop ? (
            <CognitiveTestDesktopWrapper>
              <ReflexScreen
                session={session}
                onComplete={(signal) => dispatch({ type: 'TEST_COMPLETED', testName: 'reflex', signal })}
                onError={(reason) => dispatch({ type: 'ERROR', reason })}
              />
            </CognitiveTestDesktopWrapper>
          ) : (
            <ReflexScreen
              session={session}
              onComplete={(signal) => dispatch({ type: 'TEST_COMPLETED', testName: 'reflex', signal })}
              onError={(reason) => dispatch({ type: 'ERROR', reason })}
            />
          )
        )}

        {state.phase === 'test_colors' && (
          isDesktop ? (
            <CognitiveTestDesktopWrapper>
              <StroopScreen
                session={session}
                onComplete={(signal) => dispatch({ type: 'TEST_COMPLETED', testName: 'stroop', signal })}
                onError={(reason) => dispatch({ type: 'ERROR', reason })}
              />
            </CognitiveTestDesktopWrapper>
          ) : (
            <StroopScreen
              session={session}
              onComplete={(signal) => dispatch({ type: 'TEST_COMPLETED', testName: 'stroop', signal })}
              onError={(reason) => dispatch({ type: 'ERROR', reason })}
            />
          )
        )}

        {state.phase === 'test_memory' && (
          isDesktop ? (
            <CognitiveTestDesktopWrapper>
              <DigitSpanScreen
                session={session}
                onComplete={(signal) => dispatch({ type: 'TEST_COMPLETED', testName: 'digit_span', signal })}
                onError={(reason) => dispatch({ type: 'ERROR', reason })}
              />
            </CognitiveTestDesktopWrapper>
          ) : (
            <DigitSpanScreen
              session={session}
              onComplete={(signal) => dispatch({ type: 'TEST_COMPLETED', testName: 'digit_span', signal })}
              onError={(reason) => dispatch({ type: 'ERROR', reason })}
            />
          )
        )}

        {state.phase === 'test_compare' && (
          isDesktop ? (
            <CognitiveTestDesktopWrapper>
              <NBackScreen
                session={session}
                onComplete={(signal) => dispatch({ type: 'TEST_COMPLETED', testName: 'n_back', signal })}
                onError={(reason) => dispatch({ type: 'ERROR', reason })}
              />
            </CognitiveTestDesktopWrapper>
          ) : (
            <NBackScreen
              session={session}
              onComplete={(signal) => dispatch({ type: 'TEST_COMPLETED', testName: 'n_back', signal })}
              onError={(reason) => dispatch({ type: 'ERROR', reason })}
            />
          )
        )}

        {state.phase === 'test_path' && (
          isDesktop ? (
            <CognitiveTestDesktopWrapper>
              <TrailTapScreen
                session={session}
                onComplete={(signal) => dispatch({ type: 'TEST_COMPLETED', testName: 'trail_tap', signal })}
                onError={(reason) => dispatch({ type: 'ERROR', reason })}
              />
            </CognitiveTestDesktopWrapper>
          ) : (
            <TrailTapScreen
              session={session}
              onComplete={(signal) => dispatch({ type: 'TEST_COMPLETED', testName: 'trail_tap', signal })}
              onError={(reason) => dispatch({ type: 'ERROR', reason })}
            />
          )
        )}

        {state.phase === 'review' && (
          <ReviewScreen
            state={state}
            behaviorPayload={state.behaviorPayload}
            onContinue={() => {
              const payload = getPayload();
              const touchDiag = getTouchDiagnostics();
              dispatch({ type: 'BEHAVIOR_COLLECTED', payload, touchDiag });
              dispatch({ type: 'REVIEW_CONTINUE' });
            }}
            onError={(reason) => dispatch({ type: 'ERROR', reason })}
          />
        )}

        {state.phase === 'device_signals' && (
          <DeviceSignalsScreen
            signals={state.signals}
            onContinue={() => {
              const deviceSignals = continuousSignals.stop();
              if (Object.keys(deviceSignals).length > 0) {
                dispatch({ type: 'DEVICE_SIGNALS_COLLECTED', signals: deviceSignals });
              }
              dispatch({ type: 'DEVICE_SIGNALS_CONTINUE' });
            }}
          />
        )}

        {state.phase === 'readiness' && (
          <ReadinessScreen
            state={state}
            onSubmit={handleSubmit}
            onError={(reason) => dispatch({ type: 'ERROR', reason })}
          />
        )}

        {state.phase === 'submitting' && <SubmittingScreen />}

        {state.phase === 'done' && (
          <DoneScreen
            response={state.response}
            cognitiveSignals={state.cognitiveSignals}
            startedAt={state.startedAt}
            completedAt={state.completedAt}
            onReset={handleReset}
          />
        )}

        {state.phase === 'scenario_selector' && (
          isDesktop ? (
            <ScenarioSelectorScreenDesktop
              sessionPublicId={state.sessionPublicId}
              onSuspended={handleScenarioSuspended}
              onBack={() => dispatch({ type: 'SHOW_LANDING' })}
            />
          ) : (
            <ScenarioSelectorScreen
              sessionPublicId={state.sessionPublicId}
              onSuspended={handleScenarioSuspended}
              onBack={() => dispatch({ type: 'SHOW_LANDING' })}
            />
          )
        )}

        {state.phase === 'session_suspended' && (
          isDesktop ? (
            <SessionSuspendedScreenDesktop
              reason={state.error ?? 'behavioral_divergence'}
              suspensionData={state.suspensionData}
              onReverify={handleReverify}
              onBack={handleScenarioResume}
            />
          ) : (
            <SessionSuspendedScreen
              reason={state.error ?? 'behavioral_divergence'}
              suspensionData={state.suspensionData}
              onReverify={handleReverify}
              onBack={handleScenarioResume}
            />
          )
        )}

        {state.phase === 'error' && (
          <ErrorScreen
            error={state.error ?? t('error.default')}
            onRetry={handleRetry}
            onReset={handleReset}
          />
        )}
      </div>
    </LiveGuardProvider>
  );
}
