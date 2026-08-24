/**
 * LiveGuard — Type definitions
 *
 * Adapted from demoguard: removed selfie, voice, and vocal types.
 * LiveGuard only uses cognitive tests + device signals (no camera, no mic).
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import type { CognitiveSignals } from './cognitive/cognitiveTypes';
import type { BehaviorPayload, TouchDiagnosticsBehaviorSafe } from './behavior/behaviorTypes';

// ─── Device context ────────────────────────────────────────────────

export interface LiveGuardDeviceContext {
  platform: string;
  osVersion: string;
  model: string | null;
  manufacturer: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  pixelRatio: number | null;
  language: string | null;
  timezone: string | null;
  online: boolean;
}

// ─── Permissions ───────────────────────────────────────────────────

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported' | 'unknown';

export interface LiveGuardPermissions {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  notifications: PermissionStatus;
  location: PermissionStatus;
  motion: PermissionStatus;
  orientation: PermissionStatus;
}

// ─── Signal quality grade ──────────────────────────────────────────

export type SignalQuality = 'ok' | 'low' | 'missing' | 'unsupported';

// ─── Device signal metadata ───────────────────────────────────────

export interface LiveGuardMotionSignal {
  supported: boolean;
  permission: PermissionStatus;
  permission_requested?: boolean;
  sample_count: number;
  variance?: number;
  accel_x_std?: number;
  accel_y_std?: number;
  accel_z_std?: number;
  quality: SignalQuality;
}

export interface LiveGuardOrientationSignal {
  supported: boolean;
  permission: PermissionStatus;
  permission_requested?: boolean;
  sample_count: number;
  changes: number;
  quality: SignalQuality;
}

export interface LiveGuardTouchSignal {
  touch_count: number;
  pointer_type?: string;
  pressure_supported: boolean;
  pressure_avg?: number;
  touch_duration_ms?: number;
  move_distance?: number;
  multi_touch_detected: boolean;
  quality: SignalQuality;
}

export interface LiveGuardVisibilitySignal {
  blur_count: number;
  focus_count: number;
  visibility_hidden_count: number;
  hidden_duration_ms: number;
  page_focus_lost: boolean;
  quality: SignalQuality;
}

export interface LiveGuardNetworkSignal {
  online: boolean;
  effective_type?: string;
  rtt?: number;
  downlink?: number;
  api_latency_ms?: number;
  quality: SignalQuality;
}

// ─── Signals aggregate ─────────────────────────────────────────────

export interface LiveGuardSignals {
  selfie: null | undefined;
  voice: null | undefined;
  motion: LiveGuardMotionSignal | null | undefined;
  orientation: LiveGuardOrientationSignal | null | undefined;
  touch: LiveGuardTouchSignal | null | undefined;
  visibility: LiveGuardVisibilitySignal | null | undefined;
  network: LiveGuardNetworkSignal | null | undefined;
  cognitive?: CognitiveSignals | null;
  behavior?: BehaviorPayload | null;
  touchDiagnostics?: TouchDiagnosticsSafe;
  touchDiagnosticsBehavior?: TouchDiagnosticsBehaviorSafe;
}

// ─── Quality ───────────────────────────────────────────────────────

export interface LiveGuardQuality {
  signal_completeness: number;
  device_ready: boolean;
  permissions_ready: boolean;
  overall_ready: boolean;
  critical_missing: string[];
  missing_optional: string[];
}

// ─── Safe diagnostics contracts ───────────────────────────────────

export interface TouchDiagnosticsSafe {
  status: 'ok' | 'review' | 'missing' | 'unsupported';
  supported: boolean;
  interactionCount: number;
  touchStartCount?: number;
  pointerTouchCount?: number;
  quality: 'ok' | 'review' | 'missing' | 'unsupported';
  reasonSafe: string;
}

// ─── Payload ───────────────────────────────────────────────────────

export interface LiveGuardPayload {
  hcs_session_public_id: string;
  source: 'liveguard_mobile';
  demo_guard: {
    version: string;
    started_at: string;
    completed_at: string;
    device: LiveGuardDeviceContext;
    permissions: LiveGuardPermissions;
    signals: LiveGuardSignals;
    quality: LiveGuardQuality;
    test_scope?: string;
    presentation_variant?: string;
  };
}

// ─── Safe response (filtered, no PII) ──────────────────────────────

export interface LiveGuardHybridFusion {
  triggered: boolean;
  globalDecision?: string;
}

export interface LiveGuardSafeResponse {
  ok: boolean;
  source: 'liveguard_mobile';
  status: 'submitted' | 'review' | 'failed';
  received?: boolean;
  quality_score?: number;
  ready?: boolean;
  message?: string;
  traceId?: string;
  hybridFusion?: LiveGuardHybridFusion;
}
