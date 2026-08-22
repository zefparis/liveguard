/**
 * LiveGuard — Safe diagnostics builders
 *
 * Adapted from demoguard: removed voice diagnostics builder.
 * Only touch diagnostics remain.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import type { LiveGuardTouchSignal, TouchDiagnosticsSafe } from '../liveguard/types';
import type { TouchDiagnosticsBehaviorSafe } from '../liveguard/behavior/behaviorTypes';

export function buildTouchDiagnosticsSafe(
  touchSignal: LiveGuardTouchSignal | null | undefined,
  behaviorDiag: TouchDiagnosticsBehaviorSafe | null,
): TouchDiagnosticsSafe {
  if (behaviorDiag) {
    return {
      status: behaviorDiag.status,
      supported: behaviorDiag.supported,
      interactionCount: behaviorDiag.interactionCount,
      quality: behaviorDiag.quality,
      reasonSafe: behaviorDiag.reasonSafe,
    };
  }
  if (touchSignal) {
    return {
      status: touchSignal.quality === 'ok' ? 'ok' : touchSignal.quality === 'unsupported' ? 'unsupported' : 'review',
      supported: touchSignal.quality !== 'unsupported',
      interactionCount: touchSignal.touch_count,
      quality: touchSignal.quality === 'ok' ? 'ok' : touchSignal.quality === 'unsupported' ? 'unsupported' : 'review',
      reasonSafe: touchSignal.quality === 'ok' ? 'touch_ok' : touchSignal.quality === 'unsupported' ? 'touch_unsupported' : 'touch_low_quality',
    };
  }
  return {
    status: 'missing',
    supported: false,
    interactionCount: 0,
    quality: 'missing',
    reasonSafe: 'touch_missing',
  };
}
