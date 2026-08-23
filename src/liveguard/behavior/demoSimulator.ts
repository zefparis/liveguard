/**
 * LiveGuard — Demo simulation signal alteration
 *
 * Ported verbatim from pulseguard-app. Generic, zero PulseGuard dependencies.
 *
 * DEMO ONLY — NEVER used in production. These functions artificially
 * alter behavioral snapshots to simulate different attack scenarios
 * for the 6 demo screens. They are only callable from within the
 * ScenarioDemoScreen context (enforced by the beacon's isDemo flag).
 *
 * Scenarios:
 *   - 'other_user' (2,4,5): Shifts all behavioral metrics to
 *     simulate a different person interacting with the session.
 *   - 'bot' (3): Sets all variance to zero, perfectly regular intervals
 *     to trigger bot detection.
 *   - 'mass_attempts' (6): Does not alter the snapshot — the beacon
 *     sends rapid pings to increase the server-side network risk score.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import type { BehaviorSnapshot, DemoSimulationMode } from './telemetryTypes';

/**
 * Apply demo simulation to a behavioral snapshot.
 * Returns a new snapshot with altered values.
 * DEMO ONLY — never call outside ScenarioDemoScreen.
 */
export function applyDemoSimulation(
  snapshot: BehaviorSnapshot,
  mode: DemoSimulationMode,
): BehaviorSnapshot {
  if (mode === 'none') return snapshot;

  if (mode === 'other_user') {
    return simulateOtherUser(snapshot);
  }

  if (mode === 'bot') {
    return simulateBot(snapshot);
  }

  // mass_attempts: no snapshot alteration — rapid pings handled by beacon
  return snapshot;
}

/**
 * Simulate a different user by significantly shifting all behavioral metrics.
 * This creates a large divergence from the reference profile, triggering
 * the server-side behavioral invalidation after consecutive pings.
 *
 * The shifts are deliberately large (> 40% change) to ensure detection
 * even with the EMA smoothing and multi-ping threshold.
 */
function simulateOtherUser(snapshot: BehaviorSnapshot): BehaviorSnapshot {
  return {
    ...snapshot,
    // Mouse: different speed (2x faster), different curvature (reversed)
    mouseSpeedAvg: snapshot.mouseSpeedAvg !== null
      ? Math.round(snapshot.mouseSpeedAvg * 2.2)
      : 850,
    mouseCurvatureAvg: snapshot.mouseCurvatureAvg !== null
      ? Math.round(Math.abs(0.8 - snapshot.mouseCurvatureAvg) * 100) / 100
      : 0.8,
    mousePauseCount: Math.max(0, snapshot.mousePauseCount + 5),

    // Keystroke: much faster typing, different hold pattern
    keystrokeIntervalAvg: snapshot.keystrokeIntervalAvg !== null
      ? Math.round(snapshot.keystrokeIntervalAvg * 0.45) // ~2x faster
      : 80,
    keystrokeHoldAvg: snapshot.keystrokeHoldAvg !== null
      ? Math.round(snapshot.keystrokeHoldAvg * 0.5) // shorter holds
      : 40,
    keystrokeVariance: snapshot.keystrokeVariance !== null
      ? Math.round(snapshot.keystrokeVariance * 3) // more irregular
      : 5000,

    // Touch: different rhythm
    touchIntervalAvg: snapshot.touchIntervalAvg !== null
      ? Math.round(snapshot.touchIntervalAvg * 1.8)
      : 600,
    touchVariance: snapshot.touchVariance !== null
      ? Math.round(snapshot.touchVariance * 2.5)
      : 80000,

    // Scroll: different speed
    scrollSpeedAvg: snapshot.scrollSpeedAvg !== null
      ? Math.round(snapshot.scrollSpeedAvg * 0.4) // much slower
      : 120,
    scrollPauseCount: snapshot.scrollPauseCount + 8,

    timestamp: new Date().toISOString(),
  };
}

/**
 * Simulate a bot by setting all variance to zero and making all intervals
 * perfectly regular. This is the strongest bot signal — humans cannot
 * achieve zero variance in their interaction patterns.
 */
function simulateBot(snapshot: BehaviorSnapshot): BehaviorSnapshot {
  return {
    ...snapshot,
    // Mouse: perfectly straight, constant speed, no pauses
    mouseSpeedAvg: 500, // constant speed
    mouseCurvatureAvg: 0, // perfectly straight
    mousePauseCount: 0,

    // Keystroke: perfectly regular intervals, zero variance
    keystrokeIntervalAvg: 120, // exact same interval every time
    keystrokeHoldAvg: 60, // exact same hold every time
    keystrokeVariance: 0, // ZERO variance — strongest bot signal

    // Touch: perfectly regular
    touchIntervalAvg: 300,
    touchVariance: 0, // ZERO variance

    // Scroll: perfectly regular
    scrollSpeedAvg: 400,
    scrollPauseCount: 0,

    timestamp: new Date().toISOString(),
  };
}
