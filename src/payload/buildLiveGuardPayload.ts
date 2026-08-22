/**
 * LiveGuard — Payload builder (pure function)
 *
 * Assembles the final LiveGuardPayload at submit time.
 * Adapted from demoguard: removed selfie/voice/sensitive fields.
 * Shape remains compatible with the HV Zod schema (optional fields absent).
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import type { LiveGuardPayload, LiveGuardSignals } from '../liveguard/types';
import type { LiveGuardState } from '../state/liveguardReducer';
import type { BehaviorPayload, TouchDiagnosticsBehaviorSafe } from '../liveguard/behavior/behaviorTypes';
import { LIVEGUARD_VERSION, LIVEGUARD_SOURCE } from '../liveguard/constants';
import { computeQuality } from '../liveguard/quality/signalCompleteness';
import { computeCognitiveSummary } from '../liveguard/cognitive/cognitiveScoring';
import { buildTouchDiagnosticsSafe } from './diagnosticsSafe';

export function buildLiveGuardPayload(
  state: LiveGuardState,
  behaviorPayload: BehaviorPayload | null,
  behaviorDiag: TouchDiagnosticsBehaviorSafe | null,
): LiveGuardPayload {
  const cognitiveWithSummary = state.cognitiveSignals
    ? { ...state.cognitiveSignals, summary: computeCognitiveSummary(state.cognitiveSignals) }
    : null;

  const signals: LiveGuardSignals = {
    selfie: undefined,
    voice: undefined,
    motion: state.signals.motion ?? undefined,
    orientation: state.signals.orientation ?? undefined,
    touch: state.signals.touch ?? undefined,
    visibility: state.signals.visibility ?? undefined,
    network: state.signals.network ?? undefined,
    cognitive: cognitiveWithSummary,
    behavior: behaviorPayload,
    touchDiagnostics: buildTouchDiagnosticsSafe(
      state.signals.touch,
      behaviorDiag,
    ),
    touchDiagnosticsBehavior: behaviorDiag ?? undefined,
  };

  const device = state.device!;
  const permissions = state.permissions!;

  const quality = computeQuality(signals, device, permissions, state.testScope);

  return {
    hcs_session_public_id: state.sessionPublicId,
    source: LIVEGUARD_SOURCE,
    demo_guard: {
      version: LIVEGUARD_VERSION,
      started_at: state.startedAt ?? new Date().toISOString(),
      completed_at: state.completedAt ?? new Date().toISOString(),
      device,
      permissions,
      signals,
      quality,
      ...(state.testScope ? { test_scope: state.testScope } : {}),
    },
  };
}
