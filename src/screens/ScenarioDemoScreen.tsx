/**
 * LiveGuard — Scenario Demo Screen (6 scenarios)
 *
 * 4-state visual system per scenario:
 *   idle → analyzing → detected → transitioning
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
import type { DemoSimulationMode, SuspensionData } from '../liveguard/behavior/telemetryTypes';

// ─── Types ───────────────────────────────────────────────────────────

interface ScenarioInfo {
  id: number;
  key: string;
  image: string;
  simulationMode?: DemoSimulationMode;
  massAttempt?: boolean;
  contextLabel: string;
  actionLabel: string;
  graphMode: 'human' | 'other_user' | 'bot' | 'mass';
}

const SCENARIOS: ScenarioInfo[] = [
  { id: 1, key: 'blur_focus', image: '/scenarios/1.jpeg', contextLabel: 'Transfert de 250,00 € vers Compte ****4471', actionLabel: 'Simuler un appel', graphMode: 'human' },
  { id: 2, key: 'mouse_behavior', image: '/scenarios/2.jpeg', simulationMode: 'other_user', contextLabel: 'Transfert de 1 200,00 € vers Compte ****8823', actionLabel: 'Simuler un changement d\'utilisateur', graphMode: 'other_user' },
  { id: 3, key: 'bot_detection', image: '/scenarios/3.jpeg', simulationMode: 'bot', contextLabel: 'Transfert de 500,00 € vers Compte ****1192', actionLabel: 'Simuler un bot', graphMode: 'bot' },
  { id: 4, key: 'touch_pattern', image: '/scenarios/4.jpeg', simulationMode: 'other_user', contextLabel: 'Transfert de 75,00 € vers Compte ****5534', actionLabel: 'Simuler un tactile anormal', graphMode: 'other_user' },
  { id: 5, key: 'session_continuity', image: '/scenarios/5.jpeg', simulationMode: 'other_user', contextLabel: 'Transfert de 2 000,00 € vers Compte ****7701', actionLabel: 'Simuler la dérive', graphMode: 'other_user' },
  { id: 6, key: 'mass_attempts', image: '/scenarios/6.jpeg', massAttempt: true, contextLabel: 'Tentatives de connexion répétées', actionLabel: 'Simuler 10 tentatives', graphMode: 'mass' },
];

type Phase = 'idle' | 'analyzing' | 'detected' | 'transitioning';

interface Props {
  sessionPublicId: string;
  onSuspended: (data: SuspensionData) => void;
  onBack: () => void;
}

// ─── ActivityGraph: living SVG line chart ─────────────────────────────

function ActivityGraph({ mode, phase }: { mode: ScenarioInfo['graphMode']; phase: Phase }) {
  const [points, setPoints] = useState<number[]>(() => generatePoints(mode, 'idle', 40));
  const rafRef = useRef<number>(0);
  const lastUpdate = useRef(0);

  useEffect(() => {
    const tick = (ts: number) => {
      if (ts - lastUpdate.current > 120) {
        lastUpdate.current = ts;
        setPoints((prev) => {
          const next = [...prev.slice(1)];
          next.push(generateNext(mode, phase, prev[prev.length - 1] ?? 50));
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mode, phase]);

  const w = 300;
  const h = 80;
  const step = w / (points.length - 1);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${h - p}`).join(' ');
  const areaPath = `${path} L ${w} ${h} L 0 ${h} Z`;

  const color = phase === 'detected' ? '#ef4444' : phase === 'analyzing' ? '#f59e0b' : '#3b82f6';
  const fillColor = phase === 'detected' ? 'rgba(239,68,68,0.12)' : phase === 'analyzing' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.10)';

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="demo-graph" aria-hidden="true">
      <path d={areaPath} fill={fillColor} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w - step} cy={h - points[points.length - 1]} r="3" fill={color} className="demo-graph-dot" />
    </svg>
  );
}

function generatePoints(mode: ScenarioInfo['graphMode'], phase: Phase, count: number): number[] {
  const pts: number[] = [];
  let last = 50;
  for (let i = 0; i < count; i++) {
    pts.push(last);
    last = generateNext(mode, phase, last);
  }
  return pts;
}

function generateNext(mode: ScenarioInfo['graphMode'], phase: Phase, last: number): number {
  if (phase === 'idle') {
    // gentle organic wandering
    const delta = (Math.random() - 0.5) * 12;
    return clamp(last + delta, 15, 65);
  }
  if (phase === 'analyzing') {
    if (mode === 'bot') {
      // perfectly regular, near-flat with tiny mechanical jitter
      return clamp(40 + Math.sin(Date.now() / 200) * 1.5, 35, 45);
    }
    if (mode === 'mass') {
      // sharp spikes
      return Math.random() > 0.5 ? clamp(last + 25, 10, 75) : clamp(last - 20, 10, 75);
    }
    if (mode === 'other_user') {
      // visibly different pattern — bigger swings, shifted baseline
      return clamp(last + (Math.random() - 0.5) * 30, 10, 75);
    }
    // default: more active
    return clamp(last + (Math.random() - 0.5) * 18, 10, 70);
  }
  if (phase === 'detected') {
    // erratic, alarming
    return clamp(last + (Math.random() - 0.5) * 35, 5, 75);
  }
  // transitioning: calming down
  return clamp(last + (Math.random() - 0.5) * 8, 20, 60);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ─── StatusDot ────────────────────────────────────────────────────────

function StatusDot({ phase }: { phase: Phase }) {
  const config = {
    idle:         { color: '#6b7280', label: 'En observation',          icon: '●' },
    analyzing:    { color: '#f59e0b', label: 'Analyse en cours…',        icon: '◐' },
    detected:     { color: '#ef4444', label: 'Comportement suspect détecté', icon: '⚠' },
    transitioning: { color: '#8b5cf6', label: 'Redirection vers la vérification…', icon: '→' },
  }[phase];

  return (
    <div className="demo-status-dot" style={{ color: config.color }}>
      <span className={`demo-status-orb ${phase === 'analyzing' ? 'demo-pulse' : ''}`} style={{ background: config.color }} />
      <span className="demo-status-label">{config.icon} {config.label}</span>
    </div>
  );
}

// ─── CountdownBar ─────────────────────────────────────────────────────

function CountdownBar({ seconds, total }: { seconds: number; total: number }) {
  const pct = Math.max(0, Math.min(100, ((total - seconds) / total) * 100));
  return (
    <div className="demo-countdown">
      <div className="demo-countdown-track">
        <div className="demo-countdown-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="demo-countdown-text">{seconds}s restantes</span>
    </div>
  );
}

// ─── LockedAction ─────────────────────────────────────────────────────

function LockedAction({ scenario, phase }: { scenario: ScenarioInfo; phase: Phase }) {
  const detected = phase === 'detected';

  return (
    <div className={`demo-locked ${detected ? 'demo-locked-detected' : ''}`}>
      <div className="demo-locked-header">
        <span className="demo-locked-icon">{detected ? '🚫' : '🔒'}</span>
        <span className="demo-locked-label">{scenario.contextLabel}</span>
      </div>
      <p className="demo-locked-explain">
        {detected
          ? 'Action bloquée — comportement anormal détecté. Une vérification est requise.'
          : 'Action en attente — LiveGuard analyse votre comportement en arrière-plan.'}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────

export function ScenarioDemoScreen({ sessionPublicId, onSuspended, onBack }: Props) {
  const { t } = useI18n();
  const [activeScenario, setActiveScenario] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [signalCount, setSignalCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [networkRiskScore, setNetworkRiskScore] = useState(0);
  const [divergence, setDivergence] = useState(0);
  const [consecutiveBreaches, setConsecutiveBreaches] = useState(0);
  const [scenario1Active, setScenario1Active] = useState(false);
  const [scenario1HiddenAt, setScenario1HiddenAt] = useState<number | null>(null);
  const [buttonPulsing, setButtonPulsing] = useState(false);

  const suspendedRef = useRef(false);
  const scenario1HiddenAtRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const signalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastBeaconResponse = useRef<{ divergence?: number; consecutiveBreaches?: number; networkRiskScore?: number; featureBreakdown?: SuspensionData['featureBreakdown'] }>({});

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
            onSuspended({
              reason: 'behavioral_divergence',
              divergence: lastBeaconResponse.current.divergence,
              consecutiveBreaches: lastBeaconResponse.current.consecutiveBreaches,
              featureBreakdown: lastBeaconResponse.current.featureBreakdown,
              detectedAt: new Date().toISOString(),
            });
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

  // ─── Signal counter: increments continuously ──────────────────────
  useEffect(() => {
    if (!activeScenario) {
      signalTimerRef.current = setInterval(() => {
        setSignalCount((c) => c + Math.floor(Math.random() * 3) + 1);
      }, 800);
    } else {
      // faster during analysis
      signalTimerRef.current = setInterval(() => {
        setSignalCount((c) => c + Math.floor(Math.random() * 5) + 2);
      }, 400);
    }
    return () => { if (signalTimerRef.current) clearInterval(signalTimerRef.current); };
  }, [activeScenario]);

  // ─── Visibility handler for scenario 1 (blur/focus) ───────────────
  // Uses a ref for scenario1HiddenAtRef to avoid stale closures:
  // when the tab is hidden, the browser pauses JS, so React state updates
  // and effect re-runs don't happen. The old listener keeps the old state
  // value in its closure. A ref is mutable and always current.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (!scenario1Active) return;
      if (document.hidden) {
        scenario1HiddenAtRef.current = Date.now();
        setScenario1HiddenAt(Date.now());
        setPhase('analyzing');
      } else {
        const hiddenAt = scenario1HiddenAtRef.current;
        if (hiddenAt !== null) {
          const awayMs = Date.now() - hiddenAt;
          if (awayMs > 3000) {
            // Detected
            setPhase('detected');
            setTimeout(() => {
              if (!suspendedRef.current) {
                suspendedRef.current = true;
                setPhase('transitioning');
                setTimeout(() => onSuspended({
                  reason: 'background_timeout',
                  awayMs,
                  toleranceMs: 3000,
                  detectedAt: new Date().toISOString(),
                }), 1500);
              }
            }, 800);
          } else {
            setPhase('idle');
          }
        }
        scenario1HiddenAtRef.current = null;
        setScenario1HiddenAt(null);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [scenario1Active, onSuspended]);

  // ─── Cleanup timers on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (signalTimerRef.current) clearInterval(signalTimerRef.current);
    };
  }, []);

  // ─── Countdown helper ─────────────────────────────────────────────
  const startCountdown = useCallback((seconds: number, onDone: () => void) => {
    setCountdown(seconds);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          onDone();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  // ─── Trigger suspension with transition ───────────────────────────
  const triggerSuspension = useCallback((data: SuspensionData) => {
    if (suspendedRef.current) return;
    suspendedRef.current = true;
    setPhase('detected');
    setTimeout(() => {
      setPhase('transitioning');
      setTimeout(() => onSuspended(data), 1500);
    }, 1000);
  }, [onSuspended]);

  // ─── Handle simulation button click ───────────────────────────────
  const handleSimulate = useCallback(async (scenario: ScenarioInfo) => {
    setActiveScenario(scenario.id);
    setPhase('idle');
    setNetworkRiskScore(0);
    setDivergence(0);
    setConsecutiveBreaches(0);
    setScenario1Active(false);

    // Button pulse for 0.7s
    setButtonPulsing(true);
    await new Promise((r) => setTimeout(r, 700));
    setButtonPulsing(false);

    // Scenario 1: blur/focus — instruct user to switch tabs
    if (scenario.id === 1) {
      setScenario1Active(true);
      setPhase('idle');
      return;
    }

    // ─── Phase: analyzing ──────────────────────────────────────────
    setPhase('analyzing');

    if (scenario.massAttempt) {
      // Scenario 6: Mass attempts — send rapid pings with visible counter
      let serverRiskScore = 0;
      for (let i = 0; i < 10; i++) {
        const response = await forceBeaconNow();
        if (response) {
          if (response.networkRiskScore !== undefined) {
            serverRiskScore = response.networkRiskScore;
            setNetworkRiskScore(serverRiskScore);
          }
          if (response.invalidated) {
            triggerSuspension({
              reason: 'mass_attempts_blocked',
              networkRiskScore: serverRiskScore,
              detectedAt: new Date().toISOString(),
            });
            return;
          }
        }
        if (serverRiskScore === 0) {
          serverRiskScore = i + 1;
          setNetworkRiskScore(serverRiskScore);
        }
        if (serverRiskScore >= 8) {
          triggerSuspension({
            reason: 'mass_attempts_blocked',
            networkRiskScore: serverRiskScore,
            detectedAt: new Date().toISOString(),
          });
          return;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      // If server didn't invalidate, trigger locally
      triggerSuspension({
        reason: 'mass_attempts_blocked',
        networkRiskScore: serverRiskScore || 8,
        detectedAt: new Date().toISOString(),
      });
      return;
    }

    if (scenario.simulationMode) {
      // Scenarios 2,3,4,5: set demo simulation mode
      setDemoSimulationMode(scenario.simulationMode);

      // Bot (scenario 3): faster detection — 5s countdown
      // Others: 15s countdown (demo reference window)
      const countdownSec = scenario.graphMode === 'bot' ? 5 : 15;

      // Start visible countdown
      startCountdown(countdownSec, async () => {
        // Countdown finished — send beacons and check for invalidation
        for (let i = 0; i < 5; i++) {
          const response = await forceBeaconNow();
          if (response) {
            if (response.divergence !== undefined) setDivergence(response.divergence);
            if (response.consecutiveBreaches !== undefined) setConsecutiveBreaches(response.consecutiveBreaches);
            lastBeaconResponse.current = {
              divergence: response.divergence,
              consecutiveBreaches: response.consecutiveBreaches,
              featureBreakdown: response.featureBreakdown,
            };
            if (response.invalidated) {
              setDemoSimulationMode('none');
              triggerSuspension({
                reason: 'behavioral_divergence',
                divergence: response.divergence,
                consecutiveBreaches: response.consecutiveBreaches,
                featureBreakdown: response.featureBreakdown,
                detectedAt: new Date().toISOString(),
              });
              return;
            }
          }
          await new Promise((r) => setTimeout(r, 300));
        }
        // If server didn't invalidate, trigger locally for demo
        setDemoSimulationMode('none');
        triggerSuspension({
          reason: 'behavioral_divergence',
          divergence: lastBeaconResponse.current.divergence ?? 0.5,
          consecutiveBreaches: lastBeaconResponse.current.consecutiveBreaches ?? 3,
          featureBreakdown: lastBeaconResponse.current.featureBreakdown,
          detectedAt: new Date().toISOString(),
        });
      });

      // Also send a beacon immediately to start server-side processing
      await forceBeaconNow();
    }
  }, [startCountdown, triggerSuspension]);

  const activeScenarioInfo = SCENARIOS.find((s) => s.id === activeScenario);

  // ─── Reset state ──────────────────────────────────────────────────
  const resetState = useCallback(() => {
    setScenario1Active(false);
    setDemoSimulationMode('none');
    setActiveScenario(null);
    setPhase('idle');
    setNetworkRiskScore(0);
    setDivergence(0);
    setConsecutiveBreaches(0);
    setSignalCount(0);
    setCountdown(0);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    onBack();
  }, [onBack]);

  // ─── Mode sélection : grille des 6 cartes ───────────────────────────
  if (!activeScenario) {
    return (
      <div className="landing-page" style={{ paddingTop: '20px' }}>
        <button type="button" onClick={onBack} className="demo-back-btn">
          ← {t('demo.backToScenarios')}
        </button>

        <h1 className="demo-page-title">{t('demo.title')}</h1>
        <p className="muted demo-page-desc">{t('demo.description')}</p>

        <div className="demo-card-grid">
          {SCENARIOS.map((scenario) => (
            <div key={scenario.id} className="demo-card">
              <div className="demo-card-img">
                <img src={scenario.image} alt={t(`demo.scenario${scenario.id}.title`)} loading="lazy" />
              </div>
              <div className="demo-card-body">
                <div className="demo-card-header">
                  <span className="demo-card-badge">{t('demo.scenario')} {scenario.id}</span>
                  <span className="demo-card-title">{t(`demo.scenario${scenario.id}.title`)}</span>
                </div>
                <p className="demo-card-desc">{t(`demo.scenario${scenario.id}.description`)}</p>
                <button type="button" className="btn demo-card-btn" onClick={() => void handleSimulate(scenario)}>
                  {scenario.actionLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Mode simulation : page dédiée plein écran ──────────────────────
  const scenario = activeScenarioInfo!;

  return (
    <div className="landing-page demo-sim-page" style={{ paddingTop: '20px' }}>
      {/* Header */}
      <div className="demo-sim-header">
        <button type="button" onClick={resetState} className="demo-back-btn">← {t('demo.backToScenarios')}</button>
        <span className="demo-sim-badge">{t('demo.scenario')} {activeScenario}</span>
        <span className="demo-sim-title">{t(`demo.scenario${activeScenario}.title`)}</span>
      </div>

      {/* Status dot */}
      <StatusDot phase={phase} />

      {/* Activity graph */}
      <div className="demo-graph-container">
        <div className="demo-graph-header">
          <span className="demo-graph-title">Activité comportementale</span>
          <span className="demo-signal-count">{signalCount} signaux</span>
        </div>
        <ActivityGraph mode={scenario.graphMode} phase={phase} />
      </div>

      {/* Locked action block */}
      <LockedAction scenario={scenario} phase={phase} />

      {/* Countdown (during analyzing phase, for scenarios 2-5) */}
      {phase === 'analyzing' && countdown > 0 && !scenario.massAttempt && scenario.id !== 1 && (
        <CountdownBar seconds={countdown} total={scenario.graphMode === 'bot' ? 5 : 15} />
      )}

      {/* Scenario 1 instruction */}
      {scenario.id === 1 && phase === 'idle' && (
        <div className="demo-instruction">
          📋 Changez d'onglet pendant 3+ secondes, puis revenez pour déclencher la détection.
        </div>
      )}

      {/* Scenario 1: hidden timer */}
      {scenario.id === 1 && phase === 'analyzing' && scenario1HiddenAt !== null && (
        <div className="demo-instruction demo-instruction-warn">
          ⏱️ Onglet caché — minuteur de tolérance en cours…
        </div>
      )}

      {/* Network risk score (scenario 6) */}
      {scenario.massAttempt && phase === 'analyzing' && networkRiskScore > 0 && (
        <div className="demo-risk-bar">
          <div className="demo-risk-header">
            <span>Tentatives: {networkRiskScore} / 8</span>
            {networkRiskScore >= 8 && <span className="demo-risk-blocked">🚫 Bloqué</span>}
          </div>
          <div className="demo-risk-track">
            <div
              className="demo-risk-fill"
              style={{
                width: `${Math.min(100, (networkRiskScore / 8) * 100)}%`,
                background: networkRiskScore >= 8 ? '#ef4444' : networkRiskScore >= 5 ? '#f59e0b' : '#3b82f6',
              }}
            />
          </div>
        </div>
      )}

      {/* Divergence indicator (scenarios 2-5) */}
      {(divergence > 0 || consecutiveBreaches > 0) && phase !== 'idle' && (
        <div className={`demo-divergence ${consecutiveBreaches >= 3 ? 'demo-divergence-critical' : ''}`}>
          {t('demo.divergenceScore')}: <strong>{(divergence * 100).toFixed(0)}%</strong>
          {' · '}
          {t('demo.consecutiveBreaches')}: <strong>{consecutiveBreaches}</strong> / 3
        </div>
      )}

      {/* Action button */}
      {phase === 'idle' && (
        <button
          type="button"
          className={`btn demo-action-btn ${buttonPulsing ? 'demo-btn-pulse' : ''}`}
          onClick={() => void handleSimulate(scenario)}
          disabled={buttonPulsing}
        >
          {buttonPulsing ? '● ● ●' : scenario.actionLabel}
        </button>
      )}

      {/* Analyzing indicator */}
      {phase === 'analyzing' && (
        <div className="demo-analyzing-indicator">
          <span className="demo-spinner" />
          <span>Analyse des signaux comportementaux…</span>
        </div>
      )}

      {/* Detected indicator */}
      {phase === 'detected' && (
        <div className="demo-detected-banner">
          <span className="demo-detected-icon">⚠️</span>
          <span>Comportement suspect détecté — action bloquée</span>
        </div>
      )}

      {/* Transition indicator */}
      {phase === 'transitioning' && (
        <div className="demo-transition-banner">
          <span className="demo-spinner" />
          <span>Redirection vers la vérification…</span>
        </div>
      )}
    </div>
  );
}
