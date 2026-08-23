/**
 * LiveGuard — Behavioral telemetry types
 *
 * Adapted from pulseguard-app/behaviorTypes.ts:
 *   - Removed linkToken (LiveGuard has no token-based auth)
 *   - Added source: 'liveguard' field
 *   - Added deviceProfileId for longitudinal profiling (Part E.5)
 *   - Added viewport info for device normalization (Part E.3)
 *
 * Named telemetryTypes.ts to avoid collision with existing
 * liveguard/behavior/behaviorTypes.ts (cognitive task behavior).
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

/**
 * Behavioral summary sent by the passive beacon every 5-10s.
 * All values are aggregates — no raw coordinates or keystroke content.
 */
export interface BehaviorSnapshot {
  /** Average mouse speed (px/s). Null if no mouse movement. */
  mouseSpeedAvg: number | null;
  /** Average curvature: direction changes per movement segment (0 = straight, 1 = highly curved). */
  mouseCurvatureAvg: number | null;
  /** Number of mouse pauses (> 500ms without movement). */
  mousePauseCount: number;
  /** Total mouse movement events captured. */
  mouseEventCount: number;

  /** Average interval between keystrokes (ms). Null if no keystrokes. */
  keystrokeIntervalAvg: number | null;
  /** Average key hold time (ms). Null if no keystrokes. */
  keystrokeHoldAvg: number | null;
  /** Variance of keystroke intervals (ms²). Null if < 2 keystrokes. */
  keystrokeVariance: number | null;
  /** Total keystroke events captured. */
  keystrokeCount: number;

  /** Average interval between touch events (ms). Null if no touches. */
  touchIntervalAvg: number | null;
  /** Variance of touch intervals (ms²). Null if < 2 touches. */
  touchVariance: number | null;
  /** Total touch events captured. */
  touchCount: number;

  /** Average scroll speed (px/s). Null if no scroll. */
  scrollSpeedAvg: number | null;
  /** Number of scroll pauses (> 800ms without scroll). */
  scrollPauseCount: number;
  /** Total scroll events captured. */
  scrollEventCount: number;

  /** Total interaction events (mouse + key + touch + scroll). */
  totalEvents: number;
  /** Snapshot timestamp (ISO string). */
  timestamp: string;
}

/**
 * Reference profile established during the reference window.
 * Stored server-side (Redis), linked to the session.
 */
export type BehaviorProfile = BehaviorSnapshot;

/**
 * Demo simulation mode — only active in ScenarioDemoScreen context.
 * Alters the collected signals before beacon sends to simulate
 * different attack scenarios.
 */
export type DemoSimulationMode =
  | 'none'
  | 'other_user'    // Scenarios 2,4,5: shifted behavioral metrics
  | 'bot'           // Scenario 3: zero variance, perfectly regular
  | 'mass_attempts'; // Scenario 6: rapid repeated attempts

/**
 * Device context sent with each ping for normalization (Part E.3).
 * All values are technical — no personal data.
 */
export interface DeviceContext {
  /** Viewport width in CSS pixels. */
  viewportWidth: number;
  /** Viewport height in CSS pixels. */
  viewportHeight: number;
  /** Device pixel ratio. */
  pixelRatio: number;
  /** Platform type for device normalization. */
  platform: 'desktop' | 'mobile' | 'tablet';
}

/**
 * Configuration for the behavior beacon.
 * Adapted: removed linkToken, added source + deviceContext.
 */
export interface BehaviorBeaconConfig {
  /** Interval between beacons in ms (default: 7000). */
  intervalMs: number;
  /** Session public ID for server-side profile matching. */
  sessionPublicId: string;
  /** Source identifier — always 'liveguard' for this app. */
  source: 'liveguard';
  /** Whether this is a demo context (enables simulation overrides). */
  isDemo: boolean;
  /** Anonymous device profile ID for longitudinal profiling (Part E.5). */
  deviceProfileId?: string;
  /** Device context for normalization (Part E.3). */
  deviceContext?: DeviceContext;
}

/**
 * Per-feature divergence data returned by the backend on invalidation.
 */
export interface FeatureBreakdown {
  name: string;
  current: number | null;
  reference: number | null;
  divergence: number;
}

/**
 * Server response from the behavior-ping endpoint.
 */
export interface BehaviorPingResponse {
  ok: boolean;
  /** Current EMA divergence score (0-1). */
  divergence?: number;
  /** Whether the session was invalidated by this ping. */
  invalidated?: boolean;
  /** Number of consecutive pings exceeding threshold. */
  consecutiveBreaches?: number;
  /** Whether this ping was stored as the reference profile. */
  storedAsReference?: boolean;
  /** Whether the reference window is still accumulating (not yet active). */
  referenceWindowActive?: boolean;
  /** Total reference window duration in ms (sent during window phase). */
  referenceWindowMs?: number;
  /** Elapsed time in the reference window in ms (sent during window phase). */
  referenceWindowElapsedMs?: number;
  /** Network risk score (for scenario 6 display). */
  networkRiskScore?: number;
  /** Whether a longitudinal profile was found for this device. */
  longitudinalProfileFound?: boolean;
  /** Per-feature divergence breakdown (only present when invalidated). */
  featureBreakdown?: FeatureBreakdown[];
  message?: string;
}

/**
 * Detection data passed from ScenarioDemoScreen to SessionSuspendedScreen.
 * Contains only real values from the backend or client-side detection.
 */
export interface SuspensionData {
  /** Suspension reason string. */
  reason: string;
  /** Final EMA divergence score (0-1), from backend. */
  divergence?: number;
  /** Consecutive breach count, from backend. */
  consecutiveBreaches?: number;
  /** Network risk score (scenario 6), from backend. */
  networkRiskScore?: number;
  /** Per-feature breakdown, from backend (behavioral scenarios only). */
  featureBreakdown?: FeatureBreakdown[];
  /** For blur/focus: milliseconds the tab was hidden. */
  awayMs?: number;
  /** For blur/focus: tolerance threshold in ms. */
  toleranceMs?: number;
  /** ISO timestamp of detection. */
  detectedAt?: string;
}
