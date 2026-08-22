/**
 * LiveGuard — Reducer (single source of truth for state)
 *
 * All phase transitions go through this reducer. No setPhase elsewhere.
 *
 * Adapted from demoguard: removed 'camera' and 'voice' phases.
 * After trail_tap, always goes to 'review' (no vocal step).
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import type { LiveGuardSignals, LiveGuardPermissions, LiveGuardDeviceContext, LiveGuardQuality, LiveGuardSafeResponse, TouchDiagnosticsSafe } from '../liveguard/types';
import type { CognitiveSignals } from '../liveguard/cognitive/cognitiveTypes';
import type { BehaviorPayload, TouchDiagnosticsBehaviorSafe } from '../liveguard/behavior/behaviorTypes';

export type Phase =
  | 'idle'
  | 'showcase'
  | 'integration'
  | 'select_protection'
  | 'prep'
  | 'test_reflex'
  | 'test_colors'
  | 'test_memory'
  | 'test_compare'
  | 'test_path'
  | 'review'
  | 'device_signals'
  | 'readiness'
  | 'submitting'
  | 'done'
  | 'error';

export interface LiveGuardState {
  phase: Phase;
  sessionPublicId: string;
  testScope: string | null;
  startedAt: string | null;
  completedAt: string | null;
  device: LiveGuardDeviceContext | null;
  permissions: LiveGuardPermissions | null;
  signals: LiveGuardSignals;
  quality: LiveGuardQuality | null;
  cognitiveSignals: CognitiveSignals | null;
  touchDiagnostic: TouchDiagnosticsSafe | null;
  behaviorPayload: BehaviorPayload | null;
  touchDiagnosticsBehavior: TouchDiagnosticsBehaviorSafe | null;
  response: LiveGuardSafeResponse | null;
  error: string | null;
  protectionCategory: string | null;
}

export const initialState: LiveGuardState = {
  phase: 'showcase',
  sessionPublicId: '',
  testScope: 'cognitive-only',
  startedAt: null,
  completedAt: null,
  device: null,
  permissions: null,
  signals: {
    selfie: null,
    voice: null,
    motion: null,
    orientation: null,
    touch: null,
    visibility: null,
    network: null,
    cognitive: null,
    behavior: null,
    touchDiagnostics: undefined,
    touchDiagnosticsBehavior: undefined,
  },
  quality: null,
  cognitiveSignals: null,
  touchDiagnostic: null,
  behaviorPayload: null,
  touchDiagnosticsBehavior: null,
  response: null,
  error: null,
  protectionCategory: null,
};

export type Action =
  | { type: 'SHOW_SHOWCASE' }
  | { type: 'SHOW_INTEGRATION' }
  | { type: 'START_DEMO'; sessionPublicId: string }
  | { type: 'SELECT_PROTECTION'; sessionPublicId: string }
  | { type: 'START'; sessionPublicId: string; testScope?: string | null; protectionCategory?: string | null }
  | { type: 'PREP_READY' }
  | { type: 'DEVICE_COLLECTED'; device: LiveGuardDeviceContext }
  | { type: 'PERMISSIONS_COLLECTED'; permissions: LiveGuardPermissions }
  | { type: 'TEST_COMPLETED'; testName: string; signal: unknown }
  | { type: 'COGNITIVE_COMPLETED'; cognitive: CognitiveSignals }
  | { type: 'BEHAVIOR_COLLECTED'; payload: BehaviorPayload; touchDiag: TouchDiagnosticsBehaviorSafe }
  | { type: 'REVIEW_CONTINUE' }
  | { type: 'DEVICE_SIGNALS_COLLECTED'; signals: Partial<LiveGuardSignals> }
  | { type: 'DEVICE_SIGNALS_CONTINUE' }
  | { type: 'QUALITY_COMPUTED'; quality: LiveGuardQuality }
  | { type: 'SUBMIT' }
  | { type: 'RESPONSE_RECEIVED'; response: LiveGuardSafeResponse }
  | { type: 'ERROR'; reason: string }
  | { type: 'RETRY_PHASE' }
  | { type: 'RESET' };

const VALID_TRANSITIONS: Record<Phase, Phase[]> = {
  showcase: ['idle', 'integration', 'prep'],
  integration: ['showcase', 'idle', 'prep'],
  idle: ['select_protection', 'showcase', 'prep'],
  select_protection: ['prep', 'idle', 'showcase'],
  prep: ['test_reflex', 'error'],
  test_reflex: ['test_colors', 'error'],
  test_colors: ['test_memory', 'error'],
  test_memory: ['test_compare', 'error'],
  test_compare: ['test_path', 'error'],
  test_path: ['review', 'error'],
  review: ['device_signals', 'error'],
  device_signals: ['readiness', 'error'],
  readiness: ['submitting', 'error'],
  submitting: ['done', 'error'],
  done: ['idle', 'showcase'],
  error: ['idle', 'showcase'],
};

function isValidTransition(from: Phase, to: Phase): boolean {
  if (to === 'error') return true;
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function liveguardReducer(state: LiveGuardState, action: Action): LiveGuardState {
  switch (action.type) {
    case 'SHOW_SHOWCASE': {
      if (!isValidTransition(state.phase, 'showcase')) return state;
      return { ...state, phase: 'showcase' };
    }

    case 'SHOW_INTEGRATION': {
      if (!isValidTransition(state.phase, 'integration')) return state;
      return { ...state, phase: 'integration' };
    }

    case 'START_DEMO': {
      // From showcase/integration → go to idle (which resolves session then proceeds)
      if (!isValidTransition(state.phase, 'idle')) return state;
      return { ...state, phase: 'idle', sessionPublicId: action.sessionPublicId };
    }

    case 'SELECT_PROTECTION': {
      if (!isValidTransition(state.phase, 'select_protection')) return state;
      return { ...state, phase: 'select_protection', sessionPublicId: action.sessionPublicId };
    }

    case 'START': {
      console.log('[Reducer] START — testScope:', action.testScope ?? '(null)');
      return {
        ...initialState,
        phase: 'prep',
        sessionPublicId: action.sessionPublicId,
        testScope: action.testScope ?? 'cognitive-only',
        protectionCategory: action.protectionCategory ?? null,
        startedAt: new Date().toISOString(),
      };
    }

    case 'PREP_READY': {
      // LiveGuard always goes to test_reflex (no camera, no voice)
      const nextPhase: Phase = 'test_reflex';
      console.log('[Reducer] PREP_READY — testScope:', state.testScope, '→ nextPhase:', nextPhase);
      if (!isValidTransition(state.phase, nextPhase)) return state;
      return { ...state, phase: nextPhase };
    }

    case 'DEVICE_COLLECTED': {
      return { ...state, device: action.device };
    }

    case 'PERMISSIONS_COLLECTED': {
      return { ...state, permissions: action.permissions };
    }

    case 'TEST_COMPLETED': {
      const testName = action.testName;
      const phaseAfter: Record<string, Phase> = {
        reflex: 'test_colors',
        stroop: 'test_memory',
        digit_span: 'test_compare',
        n_back: 'test_path',
        trail_tap: 'review',
      };
      const nextPhase = phaseAfter[testName];
      if (!nextPhase || !isValidTransition(state.phase, nextPhase)) return state;

      const cognitive: CognitiveSignals = state.cognitiveSignals ?? {
        reflex: null, stroop: null, digit_span: null, n_back: null, trail_tap: null, summary: null,
      };
      (cognitive as unknown as Record<string, unknown>)[testName] = action.signal;

      return {
        ...state,
        cognitiveSignals: cognitive,
        signals: { ...state.signals, cognitive },
        phase: nextPhase,
      };
    }

    case 'COGNITIVE_COMPLETED': {
      const nextPhase: Phase = 'review';
      if (!isValidTransition(state.phase, nextPhase)) return state;
      return {
        ...state,
        cognitiveSignals: action.cognitive,
        signals: { ...state.signals, cognitive: action.cognitive },
        phase: nextPhase,
      };
    }

    case 'BEHAVIOR_COLLECTED': {
      return {
        ...state,
        behaviorPayload: action.payload,
        touchDiagnosticsBehavior: action.touchDiag,
        signals: {
          ...state.signals,
          behavior: action.payload,
          touchDiagnosticsBehavior: action.touchDiag,
        },
      };
    }

    case 'REVIEW_CONTINUE': {
      if (!isValidTransition(state.phase, 'device_signals')) return state;
      return { ...state, phase: 'device_signals' };
    }

    case 'DEVICE_SIGNALS_COLLECTED': {
      return {
        ...state,
        signals: { ...state.signals, ...action.signals },
      };
    }

    case 'DEVICE_SIGNALS_CONTINUE': {
      if (!isValidTransition(state.phase, 'readiness')) return state;
      return { ...state, phase: 'readiness' };
    }

    case 'QUALITY_COMPUTED': {
      const nextPhase: Phase = 'submitting';
      if (!isValidTransition(state.phase, nextPhase)) return state;
      return { ...state, quality: action.quality, phase: nextPhase };
    }

    case 'SUBMIT': {
      if (!isValidTransition(state.phase, 'submitting')) return state;
      return { ...state, phase: 'submitting' };
    }

    case 'RESPONSE_RECEIVED': {
      return {
        ...state,
        phase: 'done',
        response: action.response,
        completedAt: new Date().toISOString(),
      };
    }

    case 'ERROR': {
      return { ...state, phase: 'error', error: action.reason };
    }

    case 'RETRY_PHASE': {
      if (state.phase === 'error') {
        return { ...state, phase: 'prep', error: null };
      }
      return state;
    }

    case 'RESET': {
      return { ...initialState };
    }

    default:
      return state;
  }
}
