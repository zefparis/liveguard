/**
 * LiveGuard — Device signal quality assessor
 *
 * Evaluates quality of motion, orientation, touch, visibility, network signals.
 * Only uses safe metadata — never raw data.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import type {
  LiveGuardMotionSignal,
  LiveGuardOrientationSignal,
  LiveGuardTouchSignal,
  LiveGuardVisibilitySignal,
  LiveGuardNetworkSignal,
  SignalQuality,
} from '../types';

export function assessMotionQuality(signal: LiveGuardMotionSignal | null): SignalQuality {
  if (!signal) return 'missing';
  if (!signal.supported) return 'unsupported';
  return signal.quality;
}

export function assessOrientationQuality(signal: LiveGuardOrientationSignal | null): SignalQuality {
  if (!signal) return 'missing';
  if (!signal.supported) return 'unsupported';
  return signal.quality;
}

export function assessTouchQuality(signal: LiveGuardTouchSignal | null): SignalQuality {
  if (!signal) return 'missing';
  return signal.quality;
}

export function assessVisibilityQuality(signal: LiveGuardVisibilitySignal | null): SignalQuality {
  if (!signal) return 'missing';
  return signal.quality;
}

export function assessNetworkQuality(signal: LiveGuardNetworkSignal | null): SignalQuality {
  if (!signal) return 'missing';
  return signal.quality;
}
