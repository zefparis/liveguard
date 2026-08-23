/**
 * Regression test: scenario suspension transition from scenario_selector.
 *
 * Bug: after the accordion refactoring, ScenarioDemoContent is rendered
 * inside ScenarioSelectorScreen (phase: scenario_selector) instead of a
 * separate ScenarioDemoScreen (phase: scenario_demo). When the demo
 * triggers a suspension, it dispatches SCENARIO_DEMO_SUSPENDED, which
 * checks isValidTransition(state.phase, 'session_suspended'). The
 * VALID_TRANSITIONS table only allowed scenario_demo → session_suspended,
 * NOT scenario_selector → session_suspended. The reducer silently
 * rejected the transition, leaving the UI stuck on the "transitioning"
 * loading indicator forever — SessionSuspendedScreen never mounted.
 *
 * Fix: added 'session_suspended' to VALID_TRANSITIONS[scenario_selector].
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * @license Patents Pending FR2514274 | FR2514546
 */

import { describe, it, expect } from 'vitest';
import { liveguardReducer, initialState } from '../src/state/liveguardReducer';
import type { SuspensionData } from '../src/liveguard/behavior/telemetryTypes';

describe('scenario suspension transition (accordion architecture)', () => {
  it('SCENARIO_DEMO_SUSPENDED transitions from scenario_selector → session_suspended', () => {
    // Simulate entering the scenario selector
    const selectorState = {
      ...initialState,
      phase: 'scenario_selector' as const,
      sessionPublicId: 'test-session-123',
    };

    const suspensionData: SuspensionData = {
      reason: 'behavioral_divergence',
      divergence: 0.75,
      consecutiveBreaches: 3,
      detectedAt: new Date().toISOString(),
    };

    const result = liveguardReducer(selectorState, {
      type: 'SCENARIO_DEMO_SUSPENDED',
      reason: 'behavioral_divergence',
      suspensionData,
    });

    expect(result.phase).toBe('session_suspended');
    expect(result.error).toBe('behavioral_divergence');
    expect(result.suspensionData).toEqual(suspensionData);
  });

  it('SCENARIO_DEMO_SUSPENDED still works from scenario_demo (backward compat)', () => {
    const demoState = {
      ...initialState,
      phase: 'scenario_demo' as const,
      sessionPublicId: 'test-session-456',
    };

    const result = liveguardReducer(demoState, {
      type: 'SCENARIO_DEMO_SUSPENDED',
      reason: 'background_timeout',
      suspensionData: {
        reason: 'background_timeout',
        awayMs: 5000,
        toleranceMs: 3000,
        detectedAt: new Date().toISOString(),
      },
    });

    expect(result.phase).toBe('session_suspended');
    expect(result.error).toBe('background_timeout');
  });

  it('SCENARIO_DEMO_RESUME returns from session_suspended → scenario_selector', () => {
    const suspendedState = {
      ...initialState,
      phase: 'session_suspended' as const,
      sessionPublicId: 'test-session-789',
      error: 'behavioral_divergence',
    };

    const result = liveguardReducer(suspendedState, {
      type: 'SCENARIO_DEMO_RESUME',
    });

    expect(result.phase).toBe('scenario_selector');
    expect(result.error).toBeNull();
  });

  it('SCENARIO_DEMO_SUSPENDED is rejected from invalid phases (e.g. landing)', () => {
    const landingState = {
      ...initialState,
      phase: 'landing' as const,
    };

    const result = liveguardReducer(landingState, {
      type: 'SCENARIO_DEMO_SUSPENDED',
      reason: 'behavioral_divergence',
    });

    // Should be rejected — landing cannot go to session_suspended
    expect(result.phase).toBe('landing');
  });
});
