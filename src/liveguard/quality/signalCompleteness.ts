/**
 * LiveGuard — Signal completeness scorer v2 (standalone)
 *
 * Adapted from demoguard: removed selfie/voice critical slots.
 * LiveGuard only uses cognitive modules + optional device signals.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import type { LiveGuardSignals, LiveGuardPermissions, LiveGuardDeviceContext, LiveGuardQuality, SignalQuality } from '../types';

const CRITICAL_SLOTS: (keyof LiveGuardSignals)[] = [];
const OPTIONAL_SLOTS: (keyof LiveGuardSignals)[] = ['motion', 'orientation', 'touch', 'visibility', 'network'];

function isUnsupported(signal: unknown): boolean {
  return signal !== null && typeof signal === 'object' && 'quality' in signal && (signal as { quality: SignalQuality }).quality === 'unsupported';
}

export function computeSignalCompleteness(signals: LiveGuardSignals, _testScope?: string | null): number {
  const criticalSlots = CRITICAL_SLOTS;
  const criticalFilled = criticalSlots.filter((s) => signals[s] != null).length;
  const optionalFilled = OPTIONAL_SLOTS.filter((s) => {
    const sig = signals[s];
    if (sig == null) return false;
    if (isUnsupported(sig)) return true;
    return true;
  }).length;

  let cognitiveFilled = 0;
  if (signals.cognitive) {
    const cog = signals.cognitive;
    const cogModules = [cog.reflex, cog.stroop, cog.digit_span, cog.n_back, cog.trail_tap];
    cognitiveFilled = cogModules.filter((m) => m !== null).length;
  }

  const cognitiveTotal = 5;
  const totalSlots = criticalSlots.length + OPTIONAL_SLOTS.length + cognitiveTotal;
  const filled = criticalFilled + optionalFilled + cognitiveFilled;
  return filled / totalSlots;
}

function isDeviceReady(device: LiveGuardDeviceContext): boolean {
  return device.online && !!device.screenWidth && !!device.screenHeight;
}

function arePermissionsReady(perms: LiveGuardPermissions, _testScope?: string | null): boolean {
  // LiveGuard needs no media permissions — only motion/orientation (prompt is fine)
  const essential: (keyof LiveGuardPermissions)[] = [];
  return essential.every((p) => perms[p] === 'granted' || perms[p] === 'prompt');
}

export function computeQuality(
  signals: LiveGuardSignals,
  device: LiveGuardDeviceContext,
  permissions: LiveGuardPermissions,
  testScope?: string | null,
): LiveGuardQuality {
  const signal_completeness = computeSignalCompleteness(signals, testScope);
  const device_ready = isDeviceReady(device);
  const permissions_ready = arePermissionsReady(permissions, testScope);

  const criticalSlots = CRITICAL_SLOTS;
  const critical_missing: string[] = [];
  for (const slot of criticalSlots) {
    if (signals[slot] == null) critical_missing.push(slot);
  }

  const missing_optional: string[] = [];
  for (const slot of OPTIONAL_SLOTS) {
    const sig = signals[slot];
    if (sig == null) {
      missing_optional.push(slot);
    } else if (isUnsupported(sig)) {
      // unsupported is not penalized
    }
  }

  const overall_ready = device_ready && permissions_ready && critical_missing.length === 0 && signal_completeness >= 0.5;

  return {
    signal_completeness,
    device_ready,
    permissions_ready,
    overall_ready,
    critical_missing,
    missing_optional,
  };
}
