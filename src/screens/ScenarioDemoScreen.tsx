/**
 * LiveGuard — Scenario Demo Screen (6 scenarios)
 *
 * Adapted from pulseguard-app/ScenarioDemoScreen.tsx:
 *   - No linkToken (LiveGuard is public)
 *   - Uses LiveGuard behavior beacon (no API key, different endpoint)
 *   - No PulseGuardCognitiveRetest — dispatches reducer action to
 *     go through the existing LiveGuard cognitive test flow for re-verification
 *   - No reportSessionVisibility / fetchSessionStatus (no PulseGuard API)
 *   - Includes device profile ID and device context (Part E.3, E.5)
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { startBehaviorCollection, stopBehaviorCollection } from '../liveguard/behavior/behaviorCollector';
import {
  startBehaviorBeacon,
  stopBehaviorBeacon,
  setDemoSimulationMode,
  forceBeaconNow,
  getOrCreateDeviceProfileId,
  collectDeviceContext,
} from '../liveguard/behavior/behaviorBeacon';
import type { DemoSimulationMode } from '../liveguard/behavior/telemetryTypes';

interface ScenarioInfo {
  id: number;
  key: string;
  image: string;
  simulationMode?: DemoSimulationMode;
  massAttempt?: boolean;
}

const SCENARIOS: ScenarioInfo[] = [
  { id: 1, key: 'blur_focus', image: '/scenarios/1.jpeg' },
  { id: 2, key: 'mouse_behavior', image: '/scenarios/2.jpeg', simulationMode: 'other_user' },
  { id: 3, key: 'bot_detection', image: '/scenarios/3.jpeg', simulationMode: 'bot' },
  { id: 4, key: 'touch_pattern', image: '/scenarios/4.jpeg', simulationMode: 'other_user' },
  { id: 5, key: 'session_continuity', image: '/scenarios/5.jpeg', simulationMode: 'other_user' },
  { id: 6, key: 'mass_attempts', image: '/scenarios/6.jpeg', massAttempt: true },
];

interface Props {
  sessionPublicId: string;
  onSuspended: (reason: string) => void;
  onBack: () => void;
}

export function ScenarioDemoScreen({ sessionPublicId, onSuspended, onBack }: Props) {
  const { t } = useI18n();
  const [activeScenario, setActiveScenario] = useState<number | null>(null);
  const [networkRiskScore, setNetworkRiskScore] = useState(0);
  const [divergence, setDivergence] = useState(0);
  const [consecutiveBreaches, setConsecutiveBreaches] = useState(0);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [referenceWindowActive, setReferenceWindowActive] = useState(false);
  const [referenceWindowRemaining, setReferenceWindowRemaining] = useState(0);
  const [scenario1Active, setScenario1Active] = useState(false);
  const [scenario1HiddenAt, setScenario1HiddenAt] = useState<number | null>(null);

  const suspendedRef = useRef(false);
  suspendedRef.current = false;

  // ─── Start behavior collection + beacon on mount ──────────────────
  useEffect(() => {
    const deviceProfileId = getOrCreateDeviceProfileId();
    const deviceContext = collectDeviceContext();

    startBehaviorCollection();

    startBehaviorBeacon(
      {
        intervalMs: 7000,
        sessionPublicId,
        source: 'liveguard',
        isDemo: true,
        deviceProfileId,
        deviceContext,
      },
      {
        onInvalidation: () => {
          if (!suspendedRef.current) {
            suspendedRef.current = true;
            onSuspended('behavioral_divergence');
          }
        },
        onNetworkRiskUpdate: (score) => {
          setNetworkRiskScore(score);
        },
      },
    );

    return () => {
      stopBehaviorBeacon();
      stopBehaviorCollection();
    };
  }, [sessionPublicId, onSuspended]);

  // ─── Visibility handler for scenario 1 (blur/focus) ───────────────
  useEffect(() => {
    const onVisibilityChange = () => {
      if (!scenario1Active) return;
      if (document.hidden) {
        setScenario1HiddenAt(Date.now());
        setStatusMessage('⏱️ Tab hidden — tolerance timer running…');
      } else {
        if (scenario1HiddenAt !== null) {
          const awayMs = Date.now() - scenario1HiddenAt;
          if (awayMs > 3000) {
            // Away for more than 3 seconds — trigger suspension
            setStatusMessage('⚠️ Away for ' + Math.round(awayMs / 1000) + 's — session suspended!');
            if (!suspendedRef.current) {
              suspendedRef.current = true;
              onSuspended('background_timeout');
            }
          } else {
            setStatusMessage('✅ Back after ' + Math.round(awayMs / 1000) + 's — session active');
          }
        }
        setScenario1HiddenAt(null);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [scenario1Active, scenario1HiddenAt, onSuspended]);

  // ─── Handle simulation button click ───────────────────────────────
  const handleSimulate = useCallback(async (scenario: ScenarioInfo) => {
    setActiveScenario(scenario.id);
    setStatusMessage(null);
    setScenario1Active(false);

    // Scenario 1: blur/focus — instruct user to switch tabs
    if (scenario.id === 1) {
      setScenario1Active(true);
      setStatusMessage('📋 Switch to another tab for 3+ seconds, then come back to trigger the suspension.');
      return;
    }

    if (scenario.massAttempt) {
      // Scenario 6: Mass attempts — send rapid pings
      setStatusMessage(t('demo.massAttemptStarted'));
      let serverRiskScore = 0;
      for (let i = 0; i < 10; i++) {
        const response = await forceBeaconNow();
        if (response) {
          if (response.networkRiskScore !== undefined) {
            serverRiskScore = response.networkRiskScore;
            setNetworkRiskScore(serverRiskScore);
          }
          if (response.invalidated) {
            if (!suspendedRef.current) {
              suspendedRef.current = true;
              onSuspended('mass_attempts_blocked');
            }
            break;
          }
        }
        // Fallback: increment locally if server doesn't return score
        if (serverRiskScore === 0) {
          serverRiskScore = i + 1;
          setNetworkRiskScore(serverRiskScore);
        }
        if (serverRiskScore >= 8) {
          if (!suspendedRef.current) {
            suspendedRef.current = true;
            onSuspended('mass_attempts_blocked');
          }
          break;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      setStatusMessage(t('demo.massAttemptComplete'));
      return;
    }

    if (scenario.simulationMode) {
      // Scenarios 2,3,4,5: set demo simulation mode
      setDemoSimulationMode(scenario.simulationMode);
      setStatusMessage(t('demo.simulationActivated'));

      // Force several rapid beacons to trigger the multi-ping threshold
      for (let i = 0; i < 5; i++) {
        const response = await forceBeaconNow();
        if (response) {
          if (response.referenceWindowActive) {
            setReferenceWindowActive(true);
            const remaining = response.referenceWindowMs && response.referenceWindowElapsedMs
              ? Math.max(0, Math.ceil((response.referenceWindowMs - response.referenceWindowElapsedMs) / 1000))
              : 0;
            setReferenceWindowRemaining(remaining);
            setStatusMessage(`⏳ Establishing reference profile… ${remaining}s remaining`);
          } else {
            setReferenceWindowActive(false);
          }
          if (response.divergence !== undefined) setDivergence(response.divergence);
          if (response.consecutiveBreaches !== undefined) setConsecutiveBreaches(response.consecutiveBreaches);
          if (response.invalidated) {
            if (!suspendedRef.current) {
              suspendedRef.current = true;
              onSuspended('behavioral_divergence');
            }
            return;
          }
        }
        await new Promise((r) => setTimeout(r, 500));
      }

      // Reset simulation mode after demo
      setDemoSimulationMode('none');
      setStatusMessage(t('demo.noDetection'));
    }
  }, [t, onSuspended]);

  return (
    <div className="landing-page" style={{ paddingTop: '20px' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#60a5fa',
          fontSize: '13px',
          marginBottom: '12px',
          cursor: 'pointer',
        }}
      >
        ← {t('demo.backToScenarios')}
      </button>

      {/* Demo mode warning */}
      <div style={{
        background: 'rgba(255, 200, 0, 0.1)',
        border: '1px solid rgba(255, 200, 0, 0.3)',
        borderRadius: '8px',
        padding: '8px 12px',
        marginBottom: '16px',
        fontSize: '12px',
        color: '#fbbf24',
      }}>
        ⚠️ {t('demo.demoModeWarning')}
      </div>

      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>
        {t('demo.title')}
      </h1>
      <p className="muted" style={{ fontSize: '13px', marginBottom: '20px' }}>
        {t('demo.description')}
      </p>

      {/* Active scenario header image */}
      {activeScenario && (
        <div style={{
          height: '180px',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          marginBottom: '16px',
        }}>
          <img
            src={`/scenarios/${activeScenario}.jpeg`}
            alt={t(`demo.scenario${activeScenario}.title`)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '14px',
          }}>
            <div>
              <span style={{
                display: 'inline-block',
                fontSize: '10px',
                fontWeight: 'bold',
                background: 'rgba(59, 130, 246, 0.3)',
                color: '#93c5fd',
                padding: '2px 6px',
                borderRadius: '4px',
                marginRight: '8px',
              }}>
                {t('demo.scenario')} {activeScenario}
              </span>
              <span style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#fff',
                textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}>
                {t(`demo.scenario${activeScenario}.title`)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Demo banking form */}
      <div style={{
        background: 'var(--surface, #1a1a2e)',
        border: '1px solid var(--surface-2, #2a2a4e)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
      }}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>
            {t('demo.recipient')}
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={t('demo.recipientPlaceholder')}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid var(--surface-2, #2a2a4e)',
              background: 'var(--surface, #1a1a2e)',
              color: 'var(--text, #fff)',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>
            {t('demo.amount')}
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid var(--surface-2, #2a2a4e)',
              background: 'var(--surface, #1a1a2e)',
              color: 'var(--text, #fff)',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          className="btn"
          style={{ width: '100%', opacity: 0.6 }}
          disabled
        >
          {t('demo.transferButton')}
        </button>
      </div>

      {/* Reference window indicator */}
      {referenceWindowActive && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '16px',
          fontSize: '13px',
        }}>
          ⏳ {t('demo.referenceWindowActive') || 'Establishing reference profile…'} {referenceWindowRemaining}s
        </div>
      )}

      {/* Status messages */}
      {statusMessage && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '16px',
          fontSize: '13px',
        }}>
          {statusMessage}
        </div>
      )}

      {/* Behavioral divergence indicator */}
      {(divergence > 0 || consecutiveBreaches > 0) && (
        <div style={{
          background: consecutiveBreaches >= 3 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 200, 0, 0.1)',
          border: `1px solid ${consecutiveBreaches >= 3 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 200, 0, 0.3)'}`,
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '16px',
          fontSize: '13px',
        }}>
          {t('demo.divergenceScore')}: <strong>{(divergence * 100).toFixed(0)}%</strong>
          {' · '}
          {t('demo.consecutiveBreaches')}: <strong>{consecutiveBreaches}</strong> / 3
        </div>
      )}

      {/* Network risk score (scenario 6) */}
      {networkRiskScore > 0 && (
        <div style={{
          background: networkRiskScore >= 8 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 200, 0, 0.1)',
          border: `1px solid ${networkRiskScore >= 8 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 200, 0, 0.3)'}`,
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '16px',
          fontSize: '13px',
        }}>
          {t('demo.networkRiskScore')}: <strong>{networkRiskScore}</strong> / 8
          {networkRiskScore >= 8 && <span style={{ marginLeft: '8px', color: '#ef4444' }}>🚫 {t('demo.blocked')}</span>}
        </div>
      )}

      {/* 6 scenario cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {SCENARIOS.map((scenario) => (
          <div
            key={scenario.id}
            style={{
              background: 'var(--surface, #1a1a2e)',
              border: '1px solid var(--surface-2, #2a2a4e)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div style={{
              height: '130px',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <img
                src={scenario.image}
                alt={t(`demo.scenario${scenario.id}.title`)}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>

            <div style={{ padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span style={{
                    display: 'inline-block',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    marginRight: '8px',
                  }}>
                    {t('demo.scenario')} {scenario.id}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>
                    {t(`demo.scenario${scenario.id}.title`)}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '10px', lineHeight: 1.4 }}>
                {t(`demo.scenario${scenario.id}.description`)}
              </p>
              <button
                className="btn"
                onClick={() => void handleSimulate(scenario)}
                disabled={activeScenario === scenario.id}
                style={{
                  width: '100%',
                  fontSize: '13px',
                  padding: '8px',
                  opacity: activeScenario === scenario.id ? 0.5 : 1,
                }}
              >
                {activeScenario === scenario.id
                  ? t('demo.simulating')
                  : t(`demo.scenario${scenario.id}.button`)}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
